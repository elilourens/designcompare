import { join } from 'path'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: '87fco3ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2025-05-17',
})

const SUPABASE_URL = 'https://udvhekbkkbhktjldgydw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdmhla2Jra2Joa3RqbGRneWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzAyODUsImV4cCI6MjA5NDAwNjI4NX0.PfKzVNaFZdwbO1d8G-GDc4YtbCU-dSC-2TSL8wuW_U8'

async function supabaseFetch(path: string, init?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...(init?.headers as Record<string, string> ?? {}),
    },
  })
}

const PORT = 3000
const ROOT = import.meta.dir

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let pathname = url.pathname

    if (pathname === '/api/posts') {
      const page = parseInt(url.searchParams.get('page') || '0')
      const limit = 10
      const from = page * limit
      const to = from + limit
      const posts = await sanity.fetch(
        `*[_type == "post"] | order(publishedAt desc)[${from}...${to}]{_id, title, slug, publishedAt, "excerpt": pt::text(body)[0..200], "thumbUrl": mainImage.asset->url}`
      )
      return new Response(JSON.stringify({ posts, hasMore: posts.length === limit }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const slugMatch = pathname.match(/^\/api\/posts\/(.+)$/)
    if (slugMatch) {
      const slug = slugMatch[1]
      const post = await sanity.fetch(
        `*[_type == "post" && slug.current == $slug][0]{
          _id, title, slug, publishedAt,
          "mainImageUrl": mainImage.asset->url,
          body[]{
            ...,
            _type == "image" => { "url": asset->url },
            _type == "comparison" => {
              question,
              "imageAUrl": imageA.asset->url,
              "imageBUrl": imageB.asset->url
            }
          }
        }`,
        { slug }
      )
      if (!post) return new Response('Not found', { status: 404 })
      return new Response(JSON.stringify(post), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (pathname === '/api/vote' && req.method === 'POST') {
      const { comparisonId, choice } = await req.json() as { comparisonId: string; choice: string }
      if (!comparisonId || !['a', 'b'].includes(choice)) {
        return new Response('Bad request', { status: 400 })
      }
      await supabaseFetch('/comparison_votes', {
        method: 'POST',
        body: JSON.stringify({ comparison_id: comparisonId, choice }),
      })
      return new Response('OK')
    }

    const votesMatch = pathname.match(/^\/api\/votes\/(.+)$/)
    if (votesMatch) {
      const comparisonId = votesMatch[1]
      const res = await supabaseFetch(
        `/comparison_votes?comparison_id=eq.${encodeURIComponent(comparisonId)}&select=choice`,
        { headers: { 'Prefer': 'count=none' } }
      )
      const rows = await res.json() as { choice: string }[]
      const a = rows.filter(r => r.choice === 'a').length
      const b = rows.filter(r => r.choice === 'b').length
      return new Response(JSON.stringify({ a, b }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (pathname === '/') pathname = '/index.html'

    const filePath = join(ROOT, pathname)
    const ext = filePath.slice(filePath.lastIndexOf('.'))
    const contentType = mimeTypes[ext] ?? 'application/octet-stream'

    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(file, {
      headers: { 'Content-Type': contentType },
    })
  },
})

console.log(`DesignVoter running at http://localhost:${PORT}`)
