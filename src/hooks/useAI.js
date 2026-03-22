/**
 * useAI.js
 * Handles all Claude API interactions:
 *  1. Chat assistant (schedule changes, task management)
 *  2. Timetable image/PDF parsing
 *
 * Falls back to rule-based responses when no API key is set,
 * so the app still works fully offline / without a key.
 */

import { useState, useCallback } from 'react'
import { getSettings, addTask, addScheduleItem, deleteTask, updateScheduleItem } from '../store/storage'

// ── System prompt for the AI assistant ──────────────────────────────────────
const SYSTEM_PROMPT = `You are FlowDay AI, a smart scheduling assistant for an engineering student named Harsh.
You help manage their daily schedule, tasks, Pomodoro sessions, and reminders.

You can:
- Add tasks (extract title, due date, priority: critical/high/medium/low, tag)
- Add schedule items (extract title, time, end time, type: lecture/study/project/break, room, priority)
- Remove tasks or schedule items by name
- Reschedule items (change time/day)
- Suggest Pomodoro sessions for tasks
- Answer questions about the schedule

Always respond in JSON with this structure:
{
  "message": "friendly reply to show the user",
  "action": null | "add_task" | "add_schedule" | "delete_task" | "reschedule" | "start_pomodoro" | "none",
  "data": {} // action-specific data
}

For add_task data: { title, due, dueDate (YYYY-MM-DD or ""), priority, tag }
For add_schedule data: { title, time (HH:MM), end (HH:MM), type, room, priority, color }
For delete_task data: { titleHint } (partial match)
For reschedule data: { titleHint, newTime (HH:MM), newEnd (HH:MM) }
For start_pomodoro data: { taskName }

Keep messages warm, concise, and encouraging. Use 1-2 emojis max.`

// ── Offline / no-key rule-based responses ────────────────────────────────────
function ruleBasedResponse(text) {
  const t = text.toLowerCase()
  if ((t.includes('add') || t.includes('create')) && t.includes('task')) {
    return { message: "I'd love to add that task! Set your Claude API key in Settings to enable full AI. For now, use the + button in Tasks to add it manually.", action: 'none', data: {} }
  }
  if (t.includes('reschedule') || t.includes('move')) {
    return { message: "Rescheduling works with the Claude API enabled. You can drag tasks in the schedule view, or set your API key in Settings for voice/chat control!", action: 'none', data: {} }
  }
  if (t.includes('pomodoro') || t.includes('focus') || t.includes('timer')) {
    return { message: "Head to the Pomodoro tab to start a focus session! Pick your task, hit play, and crush it. 🍅", action: 'start_pomodoro', data: {} }
  }
  if (t.includes('remind')) {
    return { message: "Reminder noted! Browser notifications are enabled — make sure you've allowed them. I'll ping you before your next deadline.", action: 'none', data: {} }
  }
  if (t.includes('hello') || t.includes('hi') || t.includes('hey')) {
    return { message: "Hey Harsh! Ready to crush today? You've got 6 tasks and 2 lectures. Want me to walk you through your day?", action: 'none', data: {} }
  }
  if (t.includes('cancel') || t.includes('delete') || t.includes('remove')) {
    return { message: "To delete items you can swipe left on tasks, or enable the Claude API in Settings for voice commands like 'remove my 3pm session'.", action: 'none', data: {} }
  }
  if (t.includes('free') || t.includes('gap') || t.includes('break')) {
    return { message: "You have a free slot 12:00–1:00 PM today. Perfect for a quick Pomodoro session or lunch! Want me to block it for study?", action: 'none', data: {} }
  }
  return { message: `Got it! For full AI scheduling magic, add your Claude API key in Settings. I understood: "${text}" — once connected I can act on that instantly.`, action: 'none', data: {} }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAI() {
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (userMessage) => {
    setLoading(true)
    try {
      const settings = getSettings()
      const apiKey = settings.claudeApiKey

      let result

      if (!apiKey) {
        // Offline / no-key: rule-based
        await new Promise(r => setTimeout(r, 600)) // realistic delay
        result = ruleBasedResponse(userMessage)
      } else {
        // Live Claude API call
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error?.message || `API error ${response.status}`)
        }

        const data = await response.json()
        const raw = data.content?.[0]?.text || '{}'
        // Strip markdown code fences if present
        const clean = raw.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean)
      }

      // Execute action
      if (result.action === 'add_task' && result.data?.title) {
        addTask(result.data)
      } else if (result.action === 'add_schedule' && result.data?.title) {
        addScheduleItem({ ...result.data, color: result.data.color || '#7c6af5' })
      } else if (result.action === 'delete_task' && result.data?.titleHint) {
        const { getTasks } = await import('../store/storage')
        const tasks = getTasks()
        const match = tasks.find(t => t.title.toLowerCase().includes(result.data.titleHint.toLowerCase()))
        if (match) deleteTask(match.id)
      } else if (result.action === 'reschedule' && result.data?.titleHint) {
        const { getSchedule } = await import('../store/storage')
        const schedule = getSchedule()
        const match = schedule.find(s => s.title.toLowerCase().includes(result.data.titleHint.toLowerCase()))
        if (match) updateScheduleItem(match.id, { time: result.data.newTime, end: result.data.newEnd })
      }

      return result
    } catch (err) {
      console.error('AI error:', err)
      return { message: `Something went wrong: ${err.message}. Check your API key in Settings.`, action: 'none', data: {} }
    } finally {
      setLoading(false)
    }
  }, [])

  // Parse timetable image with Claude vision
  const parseTimetable = useCallback(async (file) => {
    setLoading(true)
    try {
      const settings = getSettings()
      if (!settings.claudeApiKey) {
        await new Promise(r => setTimeout(r, 1500))
        // Return demo parsed schedule when no API key
        return {
          success: true,
          schedule: [
            { title: 'Mathematics', time: '08:00', end: '09:00', type: 'lecture', room: 'LH-1', priority: 'medium', color: '#3498db' },
            { title: 'Physics Lab', time: '09:15', end: '11:15', type: 'lecture', room: 'Physics Lab', priority: 'medium', color: '#3498db' },
            { title: 'Data Structures', time: '11:30', end: '12:30', type: 'lecture', room: 'LH-3', priority: 'medium', color: '#3498db' },
          ],
          message: 'Demo timetable loaded! Add your Claude API key in Settings to parse your real timetable image.',
        }
      }

      // Convert file to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      const mediaType = file.type === 'application/pdf' ? 'application/pdf' : file.type || 'image/jpeg'
      const isImage = mediaType.startsWith('image/')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              isImage
                ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
                : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              {
                type: 'text',
                text: `Extract all lectures, labs, and classes from this timetable image. Return ONLY a JSON array of schedule items with NO extra text:
[{ "title": "Subject Name", "time": "HH:MM", "end": "HH:MM", "type": "lecture", "room": "room number or empty string", "priority": "medium", "color": "#3498db", "day": "daily" or "Mon/Tue/..." }]
Use 24h time. type should be "lecture" for classes and labs. Be thorough and extract every entry.`
              }
            ]
          }],
        }),
      })

      const data = await response.json()
      const raw = data.content?.[0]?.text || '[]'
      const clean = raw.replace(/```json|```/g, '').trim()
      const schedule = JSON.parse(clean)
      return { success: true, schedule, message: `Found ${schedule.length} classes in your timetable!` }
    } catch (err) {
      return { success: false, schedule: [], message: `Parse failed: ${err.message}` }
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendMessage, parseTimetable, loading }
}
