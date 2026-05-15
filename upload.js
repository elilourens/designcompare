import { supabase } from './supabase.js'

const $ = id => document.getElementById(id)
const FREE_QUOTA = 3

let currentUser = null

async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'login.html'
    return
  }
  currentUser = session.user

  $('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = 'index.html'
  })

  $('paywall-pay-btn').addEventListener('click', startCheckout)

  // Show success message if returning from Stripe
  if (new URLSearchParams(location.search).get('payment') === 'success') {
    $('upload-success').textContent = 'Payment received! You can now publish your comparison.'
    $('upload-success').classList.remove('hidden')
  }

  loadMyDesigns()
}

async function startCheckout() {
  const btn = $('paywall-pay-btn')
  btn.disabled = true
  btn.textContent = 'Redirecting…'

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(
    'https://udvhekbkkbhktjldgydw.supabase.co/functions/v1/create-checkout',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: $('title').value.trim(),
        description: $('description').value.trim(),
      }),
    }
  )

  const { url, error } = await res.json()
  if (error || !url) {
    btn.disabled = false
    btn.textContent = 'Pay £9.99 to publish'
    showError('upload-error', error ?? 'Could not start checkout. Please try again.')
    return
  }

  window.location.href = url
}

window.previewFile = function(slot) {
  const file = $(`file-${slot}`).files[0]
  if (!file) return
  const preview = $(`preview-${slot}`)
  const hint = $(`drop-hint-${slot}`)
  preview.src = URL.createObjectURL(file)
  preview.classList.remove('hidden')
  hint.classList.add('hidden')
}

window.handleUpload = async function(e) {
  e.preventDefault()
  const btn = $('submit-btn')
  btn.disabled = true
  btn.textContent = 'Uploading…'
  hideMessages()

  // Quota check
  const { data: profile } = await supabase
    .from('profiles')
    .select('upload_count, paid_credits')
    .eq('id', currentUser.id)
    .single()

  const allowance = FREE_QUOTA + (profile?.paid_credits ?? 0)
  if (profile && profile.upload_count >= allowance) {
    btn.disabled = false
    btn.textContent = 'Publish comparison'
    $('paywall-modal').classList.remove('hidden')
    return
  }

  const title = $('title').value.trim()
  const description = $('description').value.trim()
  const fileA = $('file-a').files[0]
  const fileB = $('file-b').files[0]

  if (!fileA || !fileB) {
    showError('upload-error', 'Please select both design images.')
    btn.disabled = false
    btn.textContent = 'Publish comparison'
    return
  }

  try {
    const [urlA, urlB] = await Promise.all([
      uploadFile(fileA, 'a'),
      uploadFile(fileB, 'b'),
    ])

    // Moderate content before publishing
    btn.textContent = 'Checking content…'
    const { data: { session } } = await supabase.auth.getSession()
    const modRes = await fetch(
      'https://udvhekbkkbhktjldgydw.supabase.co/functions/v1/validate-upload',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageAUrl: urlA, imageBUrl: urlB, title, description }),
      }
    )
    const mod = await modRes.json()
    if (!mod.approved) {
      // Remove uploaded files since we're rejecting
      await Promise.allSettled([
        supabase.storage.from('designs').remove([urlA.split('/designs/')[1]]),
        supabase.storage.from('designs').remove([urlB.split('/designs/')[1]]),
      ])
      showError('upload-error', `Upload rejected: ${mod.reason ?? 'Content policy violation.'}`)
      btn.disabled = false
      btn.textContent = 'Publish comparison'
      return
    }

    const { error } = await supabase.from('designs').insert({
      owner_id: currentUser.id,
      title,
      description: description || null,
      image_a_url: urlA,
      image_b_url: urlB,
    })

    if (error) throw error

    $('upload-success').textContent = 'Published! Users can now vote on your design.'
    $('upload-success').classList.remove('hidden')
    $('upload-form').reset()
    resetPreviews()
    loadMyDesigns()
  } catch (err) {
    showError('upload-error', err.message)
  }

  btn.disabled = false
  btn.textContent = 'Publish comparison'
}

async function uploadFile(file, slot) {
  const ext = file.name.split('.').pop()
  const path = `${currentUser.id}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('designs').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('designs').getPublicUrl(path)
  return data.publicUrl
}

async function loadMyDesigns() {
  const list = $('my-list')
  list.innerHTML = '<div class="spinner"></div>'

  const { data: designs } = await supabase
    .from('designs')
    .select('id, title, created_at, is_active')
    .eq('owner_id', currentUser.id)
    .order('created_at', { ascending: false })

  if (!designs?.length) {
    list.innerHTML = '<p class="empty">No comparisons yet.</p>'
    return
  }

  list.innerHTML = designs.map(d => `
    <div class="my-item">
      <div>
        <strong>${escHtml(d.title)}</strong>
        <span class="my-item-date">${new Date(d.created_at).toLocaleDateString()}</span>
      </div>
      <div class="my-item-actions">
        <span class="badge ${d.is_active ? 'badge-active' : 'badge-inactive'}">
          ${d.is_active ? 'Active' : 'Inactive'}
        </span>
        <button class="btn-ghost btn-sm" onclick="toggleActive('${d.id}', ${d.is_active})">
          ${d.is_active ? 'Pause' : 'Resume'}
        </button>
      </div>
    </div>
  `).join('')
}

window.toggleActive = async function(id, current) {
  await supabase.from('designs').update({ is_active: !current }).eq('id', id)
  loadMyDesigns()
}

function showError(id, msg) {
  $(id).textContent = msg
  $(id).classList.remove('hidden')
}

function hideMessages() {
  $('upload-error').classList.add('hidden')
  $('upload-success').classList.add('hidden')
}

function resetPreviews() {
  for (const slot of ['a', 'b']) {
    $(`preview-${slot}`).classList.add('hidden')
    $(`drop-hint-${slot}`).classList.remove('hidden')
  }
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
