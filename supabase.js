import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://udvhekbkkbhktjldgydw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdmhla2Jra2Joa3RqbGRneWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzAyODUsImV4cCI6MjA5NDAwNjI4NX0.PfKzVNaFZdwbO1d8G-GDc4YtbCU-dSC-2TSL8wuW_U8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
