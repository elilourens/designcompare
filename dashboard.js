import { supabase } from './supabase.js'

const ADMIN_ID = '039bf28c-3c9e-412c-9ccc-0774743be705'
const $ = id => document.getElementById(id)

async function init() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = 'login.html'
    return
  }

  if (session.user.id === ADMIN_ID) {
    const adminLink = document.createElement('a')
    adminLink.href = 'admin.html'
    adminLink.className = 'nav-link'
    adminLink.textContent = 'Admin'
    $('logout-btn').before(adminLink)
  }

  $('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut()
    window.location.href = 'index.html'
  })

  await loadDashboard(session.user.id)
}

async function loadDashboard(userId) {
  const { data: designs, error } = await supabase
    .from('designs')
    .select('id, title, description, image_a_url, image_b_url, is_active, created_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error || !designs?.length) {
    $('dash-loading').classList.add('hidden')
    $('dash-empty').classList.remove('hidden')
    return
  }

  // Fetch all votes for these designs in one query
  const ids = designs.map(d => d.id)
  const { data: votes } = await supabase
    .from('votes')
    .select('design_id, choice')
    .in('design_id', ids)

  // Group vote counts by design
  const votemap = {}
  for (const v of votes || []) {
    if (!votemap[v.design_id]) votemap[v.design_id] = { a: 0, b: 0 }
    votemap[v.design_id][v.choice]++
  }

  $('dash-loading').classList.add('hidden')
  const list = $('dash-list')
  list.innerHTML = designs.map(d => {
    const counts = votemap[d.id] || { a: 0, b: 0 }
    const total = counts.a + counts.b
    const pctA = total ? Math.round((counts.a / total) * 100) : 50
    const pctB = 100 - pctA
    const winner = total === 0 ? null : (counts.a > counts.b ? 'a' : counts.b > counts.a ? 'b' : null)

    return `
      <article class="dash-card" data-id="${d.id}">
        <div class="dash-card-header">
          <div>
            <h2 class="dash-card-title">${escHtml(d.title)}</h2>
            ${d.description ? `<p class="dash-card-desc">${escHtml(d.description)}</p>` : ''}
          </div>
          <div class="dash-card-meta">
            <span class="badge ${d.is_active ? 'badge-active' : 'badge-inactive'}">${d.is_active ? 'active' : 'paused'}</span>
            <span class="dash-total">${total} vote${total !== 1 ? 's' : ''}</span>
            <button class="btn-ghost btn-sm" onclick="copyShareLink('${d.id}', this)">
              Copy link
            </button>
            <button class="btn-ghost btn-sm" onclick="toggleActive('${d.id}', ${d.is_active})">
              ${d.is_active ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        <div class="dash-images">
          <div class="dash-img-wrap ${winner === 'a' ? 'dash-img-winner' : ''}">
            <img src="${d.image_a_url}" alt="Design A" loading="lazy">
            ${winner === 'a' ? '<span class="winner-badge">winner</span>' : ''}
          </div>
          <div class="dash-img-wrap ${winner === 'b' ? 'dash-img-winner' : ''}">
            <img src="${d.image_b_url}" alt="Design B" loading="lazy">
            ${winner === 'b' ? '<span class="winner-badge">winner</span>' : ''}
          </div>
        </div>

        <div class="dash-bars">
          <div class="vote-bar-row">
            <span>a</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pctA}%"></div></div>
            <span style="color:var(--emerald)">${pctA}%</span>
            <span class="dash-count">${counts.a}</span>
          </div>
          <div class="vote-bar-row">
            <span>b</span>
            <div class="bar-track"><div class="bar-fill bar-fill-b" style="width:${pctB}%"></div></div>
            <span style="color:var(--emerald)">${pctB}%</span>
            <span class="dash-count">${counts.b}</span>
          </div>
        </div>
      </article>
    `
  }).join('')

  list.classList.remove('hidden')
}

window.copyShareLink = function(id, btn) {
  const url = `${location.origin}${location.pathname}?id=${id}`.replace(/dashboard\.html/, '')
  navigator.clipboard.writeText(url).then(() => {
    const original = btn.textContent
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = original }, 2000)
  })
}

window.toggleActive = async function(id, current) {
  await supabase.from('designs').update({ is_active: !current }).eq('id', id)
  const { data: { session } } = await supabase.auth.getSession()
  loadDashboard(session.user.id)
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
