import { supabase } from './supabase.js'

const $ = id => document.getElementById(id)

// Redirect if already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = 'upload.html'
})

window.switchTab = function(tab) {
  const isLogin = tab === 'login'
  $('login-form').classList.toggle('hidden', !isLogin)
  $('signup-form').classList.toggle('hidden', isLogin)
  $('tab-login').classList.toggle('active', isLogin)
  $('tab-signup').classList.toggle('active', !isLogin)
}

window.handleLogin = async function(e) {
  e.preventDefault()
  const email = $('login-email').value.trim()
  const password = $('login-password').value

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    showError('login-error', error.message)
  } else {
    window.location.href = 'upload.html'
  }
}

window.handleSignup = async function(e) {
  e.preventDefault()
  const username = $('signup-username').value.trim()
  const email = $('signup-email').value.trim()
  const password = $('signup-password').value

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })

  if (error) {
    showError('signup-error', error.message)
  } else {
    $('signup-success').classList.remove('hidden')
    $('signup-error').classList.add('hidden')
  }
}

function showError(id, msg) {
  const el = $(id)
  el.textContent = msg
  el.classList.remove('hidden')
}
