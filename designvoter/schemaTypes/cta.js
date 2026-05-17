import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'cta',
  title: 'CTA Block',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Vote on your favourite designs', value: 'vote'},
          {title: 'A/B test your designs for free', value: 'abtest'},
          {title: 'Share your design — get instant feedback', value: 'feedback'},
          {title: 'See what your audience really prefers', value: 'audience'},
        ],
        layout: 'radio',
      },
      initialValue: 'vote',
    }),
  ],
  preview: {
    select: {variant: 'variant'},
    prepare({variant}) {
      const labels = {
        vote: 'Vote on your favourite designs',
        abtest: 'A/B test your designs for free',
        feedback: 'Share your design — get instant feedback',
        audience: 'See what your audience really prefers',
      }
      return {title: `CTA: ${labels[variant] || variant}`}
    },
  },
})
