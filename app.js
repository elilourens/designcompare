import { supabase } from './supabase.js'

// Anonymous session ID for non-logged-in voters
function getSessionId() {
  let id = localStorage.getItem('session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('session_id', id)
  }
  return id
}

// Track which designs the user has already seen this session
function getSeenIds() {
  return JSON.parse(localStorage.getItem('seen_ids') || '[]')
}
function markSeen(id) {
  const seen = getSeenIds()
  if (!seen.includes(id)) seen.push(id)
  localStorage.setItem('seen_ids', JSON.stringify(seen))
}

const $ = id => document.getElementById(id)

let currentDesign = null
let currentUser = null

async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser = session?.user ?? null

  if (currentUser) {
    $('dashboard-link').classList.remove('hidden')
    $('upload-link').classList.remove('hidden')
    $('login-link').classList.add('hidden')
    $('logout-btn').classList.remove('hidden')
  }

  $('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.reload()
  })

  const sharedId = new URLSearchParams(window.location.search).get('id')
  if (sharedId) {
    await loadById(sharedId)
  } else {
    await loadNext()
  }
}

async function loadById(id) {
  show('loading')

  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !design) {
    show('done')
    return
  }

  currentDesign = design

  $('img-a').src = design.image_a_url
  $('img-b').src = design.image_b_url
  $('design-title').innerHTML = `<span class="title-quote">“</span>${design.title}<span class="title-quote">”</span>`

  $('inline-bar-a').classList.add('hidden')
  $('inline-bar-b').classList.add('hidden')
  $('card-a').disabled = false
  $('card-b').disabled = false
  $('card-a').classList.remove('voted-card', 'other-card')
  $('card-b').classList.remove('voted-card', 'other-card')

  window.triggerGridReveal?.()
  show('compare-view')
}

async function loadNext() {
  show('loading')

  const seen = getSeenIds()

  // Fetch a design the user hasn't voted on yet
  let query = supabase
    .from('designs')
    .select('*')
    .eq('is_active', true)

  if (seen.length) query = query.not('id', 'in', `(${seen.join(',')})`)

  const { data: designs, error } = await query.limit(20)

  if (error || !designs?.length) {
    show('done')
    return
  }

  // Pick random from the batch
  const design = designs[Math.floor(Math.random() * designs.length)]
  currentDesign = design

  $('img-a').src = design.image_a_url
  $('img-b').src = design.image_b_url
  $('design-title').innerHTML = `<span class="title-quote">“</span>${design.title}<span class="title-quote">”</span>`

  $('inline-bar-a').classList.add('hidden')
  $('inline-bar-b').classList.add('hidden')
  $('card-a').disabled = false
  $('card-b').disabled = false
  $('card-a').classList.remove('voted-card', 'other-card')
  $('card-b').classList.remove('voted-card', 'other-card')

  window.triggerGridReveal?.()
  show('compare-view')
}

window.vote = async function(choice) {
  if (!currentDesign) return

  const payload = {
    design_id: currentDesign.id,
    choice,
    voter_id: currentUser?.id ?? null,
    session_id: currentUser ? null : getSessionId(),
  }

  const { error } = await supabase.from('votes').insert(payload)

  // Ignore duplicate vote errors (already voted, just show results)
  markSeen(currentDesign.id)

  // Fetch vote counts
  const { data: votes } = await supabase
    .from('votes')
    .select('choice')
    .eq('design_id', currentDesign.id)

  const total = votes?.length || 0
  const countA = votes?.filter(v => v.choice === 'a').length || 0
  const countB = total - countA
  const pctA = total ? Math.round((countA / total) * 100) : 50
  const pctB = 100 - pctA

  // Lighbox: expand chosen card, dim backdrop, shrink other
  const chosenCard = $('card-' + choice)
  const otherCard  = $('card-' + (choice === 'a' ? 'b' : 'a'))
  chosenCard.classList.add('voted-card')
  otherCard.classList.add('other-card')

  // Show bars beneath each card
  $('bar-a').style.width = '0%'
  $('bar-b').style.width = '0%'
  $('pct-a').textContent = pctA + '%'
  $('pct-b').textContent = pctB + '%'
  $('inline-bar-a').classList.remove('hidden')
  $('inline-bar-b').classList.remove('hidden')

  // Animate bars in after a tick so transition fires
  requestAnimationFrame(() => {
    $('bar-a').style.width = pctA + '%'
    $('bar-b').style.width = pctB + '%'
  })

  // Disable cards while showing results
  $('card-a').disabled = true
  $('card-b').disabled = true

  const isSharedLink = new URLSearchParams(window.location.search).has('id')
  if (isSharedLink) {
    setTimeout(() => { window.location.href = '/' }, 3000)
  } else {
    setTimeout(next, 3000)
  }
}

window.next = loadNext

function show(id) {
  for (const el of document.querySelectorAll('.state-center, #compare-view, #voted-view, #loading')) {
    el.classList.add('hidden')
  }
  $(id).classList.remove('hidden')
}

init()
