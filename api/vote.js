const SUPABASE_URL = 'https://udvhekbkkbhktjldgydw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdmhla2Jra2Joa3RqbGRneWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzAyODUsImV4cCI6MjA5NDAwNjI4NX0.PfKzVNaFZdwbO1d8G-GDc4YtbCU-dSC-2TSL8wuW_U8'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { comparisonId, choice } = req.body
  if (!comparisonId || !['a', 'b'].includes(choice)) {
    return res.status(400).json({ error: 'Bad request' })
  }

  await fetch(`${SUPABASE_URL}/rest/v1/comparison_votes`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ comparison_id: comparisonId, choice }),
  })

  res.status(200).end()
}
