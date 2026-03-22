/**
 * api/chat.js — Vercel Serverless Proxy for Gemini API
 *
 * Browser → /api/chat (this function) → Google Gemini API
 * Sidesteps CORS completely. API key never touches the browser network tab.
 *
 * Supports:
 *   - Text chat  (POST with { contents, systemInstruction, ... })
 *   - Vision     (inline_data parts for timetable image parsing)
 */

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Extract API key ────────────────────────────────────────────────────────
  const apiKey = (req.headers['authorization'] || '').replace('Bearer ', '').trim()
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing Gemini API key. Add it in FlowDay Settings.' })
  }

  // ── Model from body (default: gemini-1.5-flash — free tier) ───────────────
  const { model = 'gemini-1.5-flash', ...body } = req.body || {}
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // ── Forward to Gemini ──────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Gemini error ${geminiRes.status}`
      return res.status(geminiRes.status).json({ error: msg })
    }

    return res.status(200).json(data)

  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: 'Proxy request failed: ' + err.message })
  }
}
