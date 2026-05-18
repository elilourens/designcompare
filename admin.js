import { supabase } from './supabase.js'

const ADMIN_ID = '039bf28c-3c9e-412c-9ccc-0774743be705'

const $ = id => document.getElementById(id)

let allDesigns = []

async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || session.user.id !== ADMIN_ID) {
    window.location.href = 'index.html'
    return
  }

  $('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = 'index.html'
  })

  await loadAll()
}

async function loadAll() {
  const { data: designs, error } = await supabase
    .from('designs')
    .select('id, title, description, image_a_url, image_b_url, owner_id, created_at')
    .order('created_at', { ascending: false })

  $('admin-loading').classList.add('hidden')

  if (error) {
    $('admin-content').innerHTML = `<p style="text-align:center;color:var(--error)">Failed to load: ${error.message}</p>`
    $('admin-content').classList.remove('hidden')
    return
  }

  allDesigns = designs || []
  $('admin-content').classList.remove('hidden')
  renderList(allDesigns)

  $('search-input').addEventListener('input', () => {
    const q = $('search-input').value.trim().toLowerCase()
    renderList(q ? allDesigns.filter(d => d.title.toLowerCase().includes(q)) : allDesigns)
  })
}

function renderList(designs) {
  const list = $('admin-list')
  const count = $('admin-count')

  count.textContent = `${designs.length} post${designs.length !== 1 ? 's' : ''}`

  if (!designs.length) {
    list.innerHTML = '<p style="text-align:center;opacity:.5">No posts found.</p>'
    return
  }

  list.innerHTML = designs.map(d => `
    <div class="admin-card" id="card-${d.id}">
      <div class="admin-card-thumbs">
        <img src="${d.image_a_url}" alt="A">
        <img src="${d.image_b_url}" alt="B">
      </div>
      <div class="admin-card-body">
        <div class="admin-card-title">${escHtml(d.title)}</div>
        <div class="admin-card-meta">${new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      </div>
      <button class="btn-delete" onclick="deletePost('${d.id}', '${escAttr(d.image_a_url)}', '${escAttr(d.image_b_url)}', this)">Delete</button>
    </div>
  `).join('')
}

window.deletePost = async function(id, imageAUrl, imageBUrl, btn) {
  if (!confirm('Delete this post and all its votes? This cannot be undone.')) return

  btn.disabled = true
  btn.textContent = 'Deleting…'

  // Delete votes first (FK), then the design row
  await supabase.from('votes').delete().eq('design_id', id)
  const { error } = await supabase.from('designs').delete().eq('id', id)

  if (error) {
    btn.disabled = false
    btn.textContent = 'Delete'
    alert('Delete failed: ' + error.message)
    return
  }

  // Remove storage files (best-effort — don't block on failure)
  const toPath = url => url.split('/storage/v1/object/public/')[1]?.replace(/^[^/]+\//, '') ?? null
  const paths = [toPath(imageAUrl), toPath(imageBUrl)].filter(Boolean)
  if (paths.length) await supabase.storage.from('designs').remove(paths)

  // Remove card from UI without full reload
  allDesigns = allDesigns.filter(d => d.id !== id)
  document.getElementById(`card-${id}`)?.remove()
  $('admin-count').textContent = `${allDesigns.length} post${allDesigns.length !== 1 ? 's' : ''}`
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escAttr(str) {
  return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;')
}

init()
