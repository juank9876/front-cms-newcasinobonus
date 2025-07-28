import { fetchArticles, fetchCategories, fetchPages } from "@/api-fetcher/fetcher"
import { contextSiteSettings } from "@/app/context/getSiteSettings"
import { capitalize } from "@/utils/capitalize"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUrl(url: string): string {
  return '/' + url.replace(/^\/+/, '')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

type PageMeta = {
  id: string
  slug: string
  // puedes añadir más campos si los necesitas
}

type SlugToIdMap = Record<string, string>

export async function getPageSlugToIdMap(): Promise<SlugToIdMap> {
  const pages = await fetchPages()
  //console.log('[+] pages:', pages)
  //console.log(pages.length)
  const slugIds: PageMeta[] = pages
  //console.log(slugIds)

  const map: SlugToIdMap = {}
  for (const slugId of slugIds) {
    map[slugId.slug] = slugId.id
  }

  return map
}

export async function getCategorySlugToIdMap(): Promise<SlugToIdMap> {
  const categories = await fetchCategories()
  //console.log(categories)
  const slugIds: PageMeta[] = categories

  const map: SlugToIdMap = {}
  for (const slugId of slugIds) {
    map[slugId.slug] = slugId.id
  }

  return map
}

export async function getPostSlugToIdMap(): Promise<SlugToIdMap> {
  const posts = await fetchArticles()
  //console.log(categories)
  const slugIds: PageMeta[] = posts

  const map: SlugToIdMap = {}
  for (const slugId of slugIds) {
    map[slugId.slug] = slugId.id
  }

  return map
}

export function cleanSlug(slug: string) {
  return slug.replace(/^\/+|\/+$/g, '')
}

export function fixAttribs(attribs: Record<string, any>) {
  const newAttribs = { ...attribs };
  if (newAttribs.class) {
    newAttribs.className = newAttribs.class;
    delete newAttribs.class;
  }
  return newAttribs;
}

export async function createPageTitle(pageTitle: string) {
  const settings = await contextSiteSettings()
  const title = capitalize(settings.site_title) + " | " + capitalize(pageTitle)

  return title
}

export function decodeHtmlEntities(str: string) {
  if (!str) return '';
  return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'") // para casos como &#039;
    .replace(/\\\\'/g, "'") // para \\'
    .replace(/\\'/g, "'");  // para \'
}

export function limitCharacters(text: string, limit: number): string {
  if (!text) return '';
  if (text.length <= limit) return text;

  return text.slice(0, limit) + '...';
}