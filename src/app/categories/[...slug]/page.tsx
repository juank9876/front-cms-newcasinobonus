// app/[...slug]/page.tsx
import { notFound } from 'next/navigation'
import { fetchArticleById, fetchCategoryById, fetchPermalink } from '@/api-fetcher/fetcher'
import { getPostSlugToIdMap, getCategorySlugToIdMap, cleanSlug, createPageTitle } from '@/lib/utils'
import { capitalize } from '@/utils/capitalize'
import { PrePost } from '@/components/juankui/pre-rendered/pre-post'
import HtmlRenderer from '@/components/html-transform/html-renderer'
import { PreCategory } from '@/components/juankui/pre-rendered/pre-category'
import { CardPostCategory } from '@/components/juankui/card-post-category'
import { Category, Post } from '@/types/types'
import { debug } from '@/config/debug-log'
import { debugLog } from '@/config/debug-log'

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug = [] } = await params

    const data = await getDataFromParams(slug)

    if (data.type === 'post') {
        return {
            title: await createPageTitle(data.post.meta_title, data.post.title),
            description: capitalize(data.post.meta_description) || data.post.excerpt || '',
        }
    }

    return {
        title: await createPageTitle(data.category.meta_title, data.category.name),
        description: capitalize(data.category.meta_description) || data.category.description || '',
    }
}

/** Decide si es un post o categoría y obtiene los datos */
type RouteData =
    | { type: 'post'; post: Post }
    | { type: 'category'; category: Category }

async function getDataFromParams(slugArray: string[]): Promise<RouteData> {
    if (slugArray.length === 0) notFound()

    // 🚨 Eliminar el prefijo "categories" si existe
    if (slugArray[0] === "categories") {
        slugArray = slugArray.slice(1)
    }

    const postMap = await getPostSlugToIdMap()
    const categoryMap = await getCategorySlugToIdMap()

    const categorySlug = slugArray[slugArray.length - 1]
    const postSlug = slugArray[slugArray.length - 1]

    const categoryId = categoryMap[categorySlug]
    const postId = postMap[postSlug]

    const urlSegments = slugArray[0] === "categories" ? slugArray.slice(1) : slugArray;
    let url = "/" + urlSegments.join("/");
    if (!url.endsWith("/")) {
        url += "/";
    }

    if (categoryId) {
        const category = await fetchCategoryById(categoryId)

        const permalinkData = await fetchPermalink(categoryId, "category")
        const permalink = permalinkData.permalink

        debugLog(debug.postOrCategoryPermalink, '[+] Post or Category Permalink:' + permalink)
        debugLog(debug.currentPostOrCategoryUrl, '[+] Current Post or Category URL:' + url)

        if (permalink !== url) {
            notFound()
        }

        return { type: 'category', category }
    } else {
        console.log('Category not found', categoryId, categorySlug)
    }


    if (postId) {

        const post = (await fetchArticleById(postId)).post

        const permalinkData = await fetchPermalink(postId, "post")
        const permalink = permalinkData.permalink

        debugLog(debug.postOrCategoryPermalink, '[+] Post or Category Permalink:' + permalink)
        debugLog(debug.currentPostOrCategoryUrl, '[+] Current Post or Category URL:' + url)

        if (permalink !== url) {
            notFound()
        }
        return { type: 'post', post }
    }
    else {
        console.error('Post not found', postId, postSlug)
    }

    notFound()
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string[] }>
}) {
    const slugArray = (await params).slug || []
    const data = await getDataFromParams(slugArray)

    if (data.type === 'post') {
        const post = data.post

        return (
            <PrePost post={post} >
                <HtmlRenderer html={post.html_content} cssContent={post.css_content} />
            </PrePost>
        )
    }

    const { category } = data
    const posts = category?.posts || []

    return (
        <>
            {posts.length === 0 ? (
                <PreCategory category={category} className='flex h-full flex-col items-center justify-center'>

                    <span className="text-muted rounded-lg bg-[var(--color-accent)] px-5 py-10 text-xl italic">
                        Oops! No posts available in this category.
                    </span>
                </PreCategory>
            ) : (
                <PreCategory category={category} className='py-10 grid grid-cols-1 w-[90vw] justify-center items-center gap-5 rounded-lg lg:flex lg:flex-wrap lg:w-[70vw] '>

                    {posts.map((post) => (
                        <CardPostCategory key={post.id} post={post} category={category} />
                    ))}
                </PreCategory>
            )}

        </>
    )
}
