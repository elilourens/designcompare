import { supabase } from './supabase.js'

const $ = id => document.getElementById(id)

// Handle OAuth redirect callback and existing session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = 'upload.html'
})

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) window.location.href = 'upload.html'
})

window.handleGoogleSignIn = async function() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/upload.html' },
  })
  if (error) alert(error.message)
}

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
    const msg = error.message.toLowerCase().includes('invalid') || error.status === 400
      ? 'Incorrect email or password. Please try again.'
      : error.message
    showError('login-error', msg)
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
