import { join } from 'path'

const PORT = 3000
const ROOT = import.meta.dir

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let pathname = url.pathname

    if (pathname === '/') pathname = '/index.html'

    const filePath = join(ROOT, pathname)
    const ext = filePath.slice(filePath.lastIndexOf('.'))
    const contentType = mimeTypes[ext] ?? 'application/octet-stream'

    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(file, {
      headers: { 'Content-Type': contentType },
    })
  },
})

console.log(`DesignPick running at http://localhost:${PORT}`)
