import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: '87fco3ja',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2025-05-17',
})

export default async function handler(req, res) {
  const { slug } = req.query

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

  if (!post) return res.status(404).json({ error: 'Not found' })
  res.json(post)
}
