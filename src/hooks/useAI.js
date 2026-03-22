/**
 * useAI.js
 *
 * All Claude API calls go through /api/chat  (a local Vite proxy in dev,
 * a Vercel serverless function in production).  This completely avoids
 * CORS errors — the browser never talks to api.anthropic.com directly.
 *
 * Falls back to rule-based responses when no API key is set, so the app
 * still works offline / without a key.
 */

import { useState, useCallback } from 'react'
import { getSettings, addTask, addScheduleItem, deleteTask, updateScheduleItem, getSchedule, getTasks } from '../store/storage'

// ── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are FlowDay AI, a smart scheduling assistant for an engineering student named Harsh.
You help manage their daily schedule, tasks, Pomodoro sessions, and reminders.

You can:
- Add tasks (extract title, due date, priority: critical/high/medium/low, tag)
- Add schedule items (extract title, time, end time, type: lecture/study/project/break, room, priority)
- Remove tasks or schedule items by name
- Reschedule items (change time/day)
- Suggest Pomodoro sessions for tasks
- Answer questions about the schedule

Always respond in JSON with this exact structure (no markdown, no extra text):
{
  "message": "friendly reply to show the user",
  "action": null,
  "data": {}
}

action can be: null | "add_task" | "add_schedule" | "delete_task" | "reschedule" | "start_pomodoro" | "none"

For add_task data: { title, due, dueDate (YYYY-MM-DD or ""), priority, tag }
For add_schedule data: { title, time (HH:MM 24h), end (HH:MM 24h), type, room, priority, color (#hex) }
For delete_task data: { titleHint }
For reschedule data: { titleHint, newTime (HH:MM), newEnd (HH:MM) }
For start_pomodoro data: { taskName }

Keep messages warm, concise, encouraging. Use 1-2 emojis max.`

// ── Rule-based offline fallback ───────────────────────────────────────────────
function ruleBasedResponse(text) {
  const t = text.toLowerCase()
  if ((t.includes('add') || t.includes('create')) && t.includes('task'))
    return { message: "I'd love to add that! Enable full AI by adding your Claude API key in Settings ⚙️. For now, use the + button in the Tasks tab.", action: 'none', data: {} }
  if (t.includes('reschedule') || t.includes('move') || t.includes('change time'))
    return { message: "Add your Claude API key in Settings to enable schedule editing via chat. You can also edit items directly on the schedule.", action: 'none', data: {} }
  if (t.includes('pomodoro') || t.includes('focus') || t.includes('timer') || t.includes('start'))
    return { message: "Head to the 🍅 Pomodoro tab, pick your task and hit play. You've got this!", action: 'start_pomodoro', data: {} }
  if (t.includes('remind'))
    return { message: "Make sure browser notifications are allowed — I'll ping you at session ends and deadlines. 🔔", action: 'none', data: {} }
  if (t.includes('hello') || t.includes('hi') || t.includes('hey'))
    return { message: "Hey Harsh! 👋 Ready to crush today? Add your API key in Settings for full AI scheduling.", action: 'none', data: {} }
  if (t.includes('delete') || t.includes('remove') || t.includes('cancel'))
    return { message: "Use the ✕ button on any task to delete it, or add your Claude API key for voice/chat control.", action: 'none', data: {} }
  if (t.includes('schedule') || t.includes('today') || t.includes('lecture'))
    return { message: "Check the Today tab for your full schedule! Your lectures and tasks are laid out with priority colors. 📅", action: 'none', data: {} }
  if (t.includes('report') || t.includes('stats') || t.includes('progress'))
    return { message: "Head to the 📊 Reports tab to see your weekly focus chart, heatmap, and achievements!", action: 'none', data: {} }
  return { message: `Got it! Add your Claude API key in Settings ⚙️ to unlock full AI — I'll be able to act on "${text}" instantly.`, action: 'none', data: {} }
}

// ── Proxy URL — same path works in dev (Vite proxy) and prod (Vercel fn) ─────
const PROXY_URL = '/api/chat'

// ── Call the proxy ────────────────────────────────────────────────────────────
async function callClaude(apiKey, body) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,   // proxy extracts this → x-api-key
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // Surface a friendly message for common errors
    if (res.status === 401) throw new Error('Invalid API key — double-check it in Settings.')
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and try again.')
    if (res.status === 529) throw new Error('Anthropic servers overloaded. Try again shortly.')
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  return res.json()
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAI() {
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (userMessage) => {
    setLoading(true)
    try {
      const settings = getSettings()
      const apiKey   = settings.claudeApiKey?.trim()

      // No key → offline rule-based
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 500))
        return ruleBasedResponse(userMessage)
      }

      // Build a context snippet so Claude knows current state
      const tasks    = getTasks().filter(t => !t.done).slice(0, 8)
      const schedule = getSchedule().slice(0, 6)
      const context  = `Current pending tasks: ${tasks.map(t => t.title).join(', ') || 'none'}. Today's schedule has ${schedule.length} items.`

      const data = await callClaude(apiKey, {
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:     SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Context: ${context}\n\nUser message: ${userMessage}` }
        ],
      })

      const raw   = data.content?.[0]?.text || '{}'
      const clean = raw.replace(/```json|```/g, '').trim()
      const result = JSON.parse(clean)

      // Execute the action
      if (result.action === 'add_task' && result.data?.title) {
        addTask(result.data)
      } else if (result.action === 'add_schedule' && result.data?.title) {
        addScheduleItem({ ...result.data, color: result.data.color || '#7c6af5' })
      } else if (result.action === 'delete_task' && result.data?.titleHint) {
        const tasks = getTasks()
        const match = tasks.find(t => t.title.toLowerCase().includes(result.data.titleHint.toLowerCase()))
        if (match) deleteTask(match.id)
      } else if (result.action === 'reschedule' && result.data?.titleHint) {
        const sched = getSchedule()
        const match = sched.find(s => s.title.toLowerCase().includes(result.data.titleHint.toLowerCase()))
        if (match) updateScheduleItem(match.id, { time: result.data.newTime, end: result.data.newEnd })
      }

      return result

    } catch (err) {
      console.error('AI error:', err)
      return {
        message: `⚠️ ${err.message}`,
        action: 'none', data: {}
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Timetable image / PDF parsing ─────────────────────────────────────────
  const parseTimetable = useCallback(async (file) => {
    setLoading(true)
    try {
      const settings = getSettings()
      const apiKey   = settings.claudeApiKey?.trim()

      // Demo mode — no key
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500))
        return {
          success: true,
          schedule: [
            { title: 'Mathematics',    time: '08:00', end: '09:00', type: 'lecture', room: 'LH-1', priority: 'medium', color: '#3498db' },
            { title: 'Physics Lab',    time: '09:15', end: '11:15', type: 'lecture', room: 'Physics Lab', priority: 'medium', color: '#3498db' },
            { title: 'Data Structures',time: '11:30', end: '12:30', type: 'lecture', room: 'LH-3', priority: 'medium', color: '#3498db' },
          ],
          message: 'Demo timetable loaded! Add your Claude API key in Settings to parse your real timetable.',
        }
      }

      // Convert to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload  = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      const mediaType = file.type || 'image/jpeg'
      const isImage   = mediaType.startsWith('image/')

      const data = await callClaude(apiKey, {
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            isImage
              ? { type: 'image',    source: { type: 'base64', media_type: mediaType,          data: base64 } }
              : { type: 'document', source: { type: 'base64', media_type: 'application/pdf',  data: base64 } },
            {
              type: 'text',
              text: `Extract every lecture, lab, and class from this timetable. Return ONLY a JSON array, no other text:
[{ "title": "Subject Name", "time": "HH:MM", "end": "HH:MM", "type": "lecture", "room": "room or empty string", "priority": "medium", "color": "#3498db", "day": "daily" }]
Use 24-hour time. Be thorough — extract every entry visible.`
            }
          ]
        }],
      })

      const raw      = data.content?.[0]?.text || '[]'
      const clean    = raw.replace(/```json|```/g, '').trim()
      const schedule = JSON.parse(clean)
      return { success: true, schedule, message: `Found ${schedule.length} classes in your timetable! 🎉` }

    } catch (err) {
      return { success: false, schedule: [], message: `Parse failed: ${err.message}` }
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendMessage, parseTimetable, loading }
}
