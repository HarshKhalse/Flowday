/**
 * useAI.js — Gemini API integration for FlowDay
 *
 * Uses Google Gemini 1.5 Flash (FREE tier):
 *   - 15 requests/minute
 *   - 1 million tokens/day
 *   - $0 cost for students
 *
 * All requests go through /api/chat (Vercel serverless proxy in prod,
 * Vite dev proxy locally) to avoid CORS errors.
 *
 * Falls back to rule-based responses when no API key is set.
 */

import { useState, useCallback } from 'react'
import {
  getSettings, addTask, addScheduleItem,
  deleteTask, updateScheduleItem, getSchedule, getTasks
} from '../store/storage'

// ── Gemini model to use (free tier) ─────────────────────────────────────────
const GEMINI_MODEL = 'gemini-1.5-flash'

// ── System instruction for Gemini ────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are FlowDay AI, a smart scheduling assistant for an engineering student named Harsh.
You help manage their daily schedule, tasks, Pomodoro sessions, and reminders.

You can:
- Add tasks (extract title, due date, priority: critical/high/medium/low, tag)
- Add schedule items (extract title, time, end time, type: lecture/study/project/break, room, priority)
- Remove tasks or schedule items by name
- Reschedule items (change time/day)
- Suggest Pomodoro sessions for tasks
- Answer questions about the schedule

IMPORTANT: Always respond with ONLY a valid JSON object. No markdown, no code fences, no explanation text outside the JSON.

Response format:
{
  "message": "friendly reply to show the user (warm, concise, max 2 emojis)",
  "action": null,
  "data": {}
}

action values: null | "add_task" | "add_schedule" | "delete_task" | "reschedule" | "start_pomodoro" | "none"

For add_task: data = { title, due (human readable), dueDate (YYYY-MM-DD or ""), priority, tag }
For add_schedule: data = { title, time (HH:MM 24h), end (HH:MM 24h), type, room, priority, color (#hex) }
For delete_task: data = { titleHint }
For reschedule: data = { titleHint, newTime (HH:MM), newEnd (HH:MM) }
For start_pomodoro: data = { taskName }`

// ── Rule-based offline fallback ───────────────────────────────────────────────
function ruleBasedResponse(text) {
  const t = text.toLowerCase()
  if ((t.includes('add') || t.includes('create')) && t.includes('task'))
    return { message: "Add your Gemini API key in Settings to enable full AI. For now, use the + button in the Tasks tab! 📝", action: 'none', data: {} }
  if (t.includes('reschedule') || t.includes('move') || t.includes('change'))
    return { message: "Add your Gemini API key in Settings to edit your schedule via chat.", action: 'none', data: {} }
  if (t.includes('pomodoro') || t.includes('focus') || t.includes('timer') || t.includes('start'))
    return { message: "Head to the 🍅 Pomodoro tab, pick your task and hit play. You've got this!", action: 'start_pomodoro', data: {} }
  if (t.includes('remind'))
    return { message: "Make sure browser notifications are allowed and I'll ping you at session ends! 🔔", action: 'none', data: {} }
  if (t.includes('hello') || t.includes('hi') || t.includes('hey'))
    return { message: "Hey Harsh! 👋 Add your Gemini API key in Settings for full AI scheduling powers.", action: 'none', data: {} }
  if (t.includes('delete') || t.includes('remove') || t.includes('cancel'))
    return { message: "Use the ✕ on any task to delete it, or add your Gemini API key for voice/chat control.", action: 'none', data: {} }
  if (t.includes('schedule') || t.includes('today') || t.includes('lecture'))
    return { message: "Check the Today tab for your full schedule with priority colors! 📅", action: 'none', data: {} }
  if (t.includes('report') || t.includes('stats'))
    return { message: "Head to the 📊 Reports tab to see your weekly chart and heatmap!", action: 'none', data: {} }
  return { message: `Add your Gemini API key in Settings ⚙️ to unlock full AI — I'll act on "${text}" instantly.`, action: 'none', data: {} }
}

// ── Call Gemini through the proxy ─────────────────────────────────────────────
async function callGemini(apiKey, contents, systemInstruction = null) {
  const body = {
    model: GEMINI_MODEL,
    contents,
    generationConfig: {
      temperature:     0.3,   // lower = more predictable JSON output
      maxOutputTokens: 1024,
      responseMimeType: 'application/json', // tell Gemini to return JSON directly
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    // Surface friendly errors
    const msg = data?.error || 'Unknown error'
    if (res.status === 400 && msg.includes('API_KEY')) throw new Error('Invalid Gemini API key — check it in Settings.')
    if (res.status === 429) throw new Error('Rate limit hit (15 req/min on free tier). Wait a moment.')
    if (res.status === 403) throw new Error('API key blocked or quota exceeded. Check Google AI Studio.')
    throw new Error(msg)
  }

  return data
}

// ── Extract text from Gemini response ────────────────────────────────────────
function extractText(data) {
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAI() {
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (userMessage) => {
    setLoading(true)
    try {
      const settings = getSettings()
      const apiKey   = settings.geminiApiKey?.trim()

      // No key → offline rule-based
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 400))
        return ruleBasedResponse(userMessage)
      }

      // Build context so Gemini knows current schedule/tasks
      const tasks    = getTasks().filter(t => !t.done).slice(0, 8)
      const schedule = getSchedule().slice(0, 6)
      const context  = `Pending tasks: ${tasks.map(t => `"${t.title}" (${t.priority})`).join(', ') || 'none'}. Schedule has ${schedule.length} items today.`

      const contents = [{
        role: 'user',
        parts: [{ text: `Context: ${context}\n\nUser: ${userMessage}` }]
      }]

      const data = await callGemini(apiKey, contents, SYSTEM_INSTRUCTION)
      const raw  = extractText(data)

      // Parse JSON — Gemini with responseMimeType:'application/json' returns clean JSON
      const clean  = raw.replace(/```json|```/g, '').trim()
      const result = JSON.parse(clean)

      // ── Execute action ─────────────────────────────────────────────────
      if (result.action === 'add_task' && result.data?.title) {
        addTask(result.data)
      } else if (result.action === 'add_schedule' && result.data?.title) {
        addScheduleItem({ ...result.data, color: result.data.color || '#7c6af5' })
      } else if (result.action === 'delete_task' && result.data?.titleHint) {
        const match = getTasks().find(t =>
          t.title.toLowerCase().includes(result.data.titleHint.toLowerCase())
        )
        if (match) deleteTask(match.id)
      } else if (result.action === 'reschedule' && result.data?.titleHint) {
        const match = getSchedule().find(s =>
          s.title.toLowerCase().includes(result.data.titleHint.toLowerCase())
        )
        if (match) updateScheduleItem(match.id, { time: result.data.newTime, end: result.data.newEnd })
      }

      return result

    } catch (err) {
      console.error('AI error:', err)
      return { message: `⚠️ ${err.message}`, action: 'none', data: {} }
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Timetable image / PDF parsing ─────────────────────────────────────────
  const parseTimetable = useCallback(async (file) => {
    setLoading(true)
    try {
      const settings = getSettings()
      const apiKey   = settings.geminiApiKey?.trim()

      // Demo mode
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1500))
        return {
          success: true,
          schedule: [
            { title: 'Mathematics',     time: '08:00', end: '09:00', type: 'lecture', room: 'LH-1',        priority: 'medium', color: '#3498db' },
            { title: 'Physics Lab',     time: '09:15', end: '11:15', type: 'lecture', room: 'Physics Lab', priority: 'medium', color: '#3498db' },
            { title: 'Data Structures', time: '11:30', end: '12:30', type: 'lecture', room: 'LH-3',        priority: 'medium', color: '#3498db' },
          ],
          message: 'Demo timetable loaded! Add your Gemini API key in Settings to parse your real timetable.',
        }
      }

      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const mimeType = file.type || 'image/jpeg'

      // Gemini vision: inline_data part
      const contents = [{
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data:      base64,
            }
          },
          {
            text: `Extract every lecture, lab, tutorial, and class from this college timetable image.
Return ONLY a valid JSON array with no other text:
[
  {
    "title": "Subject Name",
    "time": "HH:MM",
    "end": "HH:MM",
    "type": "lecture",
    "room": "room number or empty string",
    "priority": "medium",
    "color": "#3498db",
    "day": "daily"
  }
]
Use 24-hour time format. Extract every single entry visible. If a subject appears multiple days, include one entry per day with the correct day field (Mon/Tue/Wed/Thu/Fri/Sat).`
          }
        ]
      }]

      const data = await callGemini(apiKey, contents)
      const raw  = extractText(data)

      const clean    = raw.replace(/```json|```/g, '').trim()
      const schedule = JSON.parse(clean)

      return {
        success: true,
        schedule,
        message: `Found ${schedule.length} classes in your timetable! 🎉`,
      }

    } catch (err) {
      return {
        success: false,
        schedule: [],
        message: `Parse failed: ${err.message}`,
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendMessage, parseTimetable, loading }
}
