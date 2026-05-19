import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: '87fco3ja',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2025-05-17',
})

export default async function handler(req, res) {
  const page = parseInt(req.query.page || '0')
  const limit = 10
  const from = page * limit
  const to = from + limit

  const posts = await sanity.fetch(
    `*[_type == "post"] | order(publishedAt desc)[${from}...${to}]{_id, title, slug, publishedAt, "excerpt": pt::text(body)[0..200], "thumbUrl": mainImage.asset->url}`
  )

  res.json({ posts, hasMore: posts.length === limit })
}
