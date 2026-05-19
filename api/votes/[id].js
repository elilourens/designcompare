const SUPABASE_URL = 'https://udvhekbkkbhktjldgydw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdmhla2Jra2Joa3RqbGRneWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzAyODUsImV4cCI6MjA5NDAwNjI4NX0.PfKzVNaFZdwbO1d8G-GDc4YtbCU-dSC-2TSL8wuW_U8'

export default async function handler(req, res) {
  const { id } = req.query

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/comparison_votes?comparison_id=eq.${encodeURIComponent(id)}&select=choice`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  const rows = await response.json()
  const a = rows.filter(r => r.choice === 'a').length
  const b = rows.filter(r => r.choice === 'b').length

  res.json({ a, b })
}
