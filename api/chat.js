/**
 * api/chat.js  —  Vercel Serverless Function
 *
 * Acts as a proxy between the FlowDay frontend and Anthropic's API.
 * This completely sidesteps CORS — the browser talks to YOUR server,
 * your server talks to Anthropic, response comes back clean.
 *
 * The API key travels in the request Authorization header from the
 * frontend, so it's never hardcoded here and works for every user.
 *
 * Deployed automatically by Vercel when you push — no extra setup needed.
 */

export default async function handler(req, res) {
  // ── CORS headers — allow your frontend origin ──────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Extract the API key from the Authorization header ─────────────────
  const authHeader = req.headers['authorization'] || ''
  const apiKey = authHeader.replace('Bearer ', '').trim()

  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(401).json({
      error: 'Missing or invalid API key. Add your Claude API key in FlowDay Settings.'
    })
  }

  // ── Forward the request body to Anthropic ─────────────────────────────
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const data = await anthropicRes.json()

    // Pass through Anthropic's status code
    return res.status(anthropicRes.status).json(data)

  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({
      error: 'Proxy request failed: ' + err.message
    })
  }
}
