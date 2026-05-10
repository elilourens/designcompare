// Grid parallax: moves opposite to mouse direction
const STRENGTH = 0.035 // fraction of viewport offset

let targetX = 0, targetY = 0
let currentX = 0, currentY = 0
let rafId = null

document.addEventListener('mousemove', (e) => {
  // Normalise to [-0.5, 0.5] relative to viewport centre
  const nx = e.clientX / window.innerWidth - 0.5
  const ny = e.clientY / window.innerHeight - 0.5
  // Opposite direction: negate
  targetX = -nx * window.innerWidth * STRENGTH
  targetY = -ny * window.innerHeight * STRENGTH
  if (!rafId) rafId = requestAnimationFrame(tick)
})

function tick() {
  rafId = null
  // Smooth lerp toward target
  currentX += (targetX - currentX) * 0.08
  currentY += (targetY - currentY) * 0.08
  document.documentElement.style.setProperty('--grid-x', `${currentX.toFixed(2)}px`)
  document.documentElement.style.setProperty('--grid-y', `${currentY.toFixed(2)}px`)
  if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
    rafId = requestAnimationFrame(tick)
  }
}
