import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'comparison',
  title: 'Design Comparison',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'e.g. "Which logo feels more trustworthy?"',
    }),
    defineField({
      name: 'imageA',
      title: 'Image A',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'imageB',
      title: 'Image B',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'question', media: 'imageA'},
    prepare({title, media}) {
      return {title: title || 'Design Comparison', media}
    },
  },
})
