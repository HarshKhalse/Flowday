/**
 * usePomodoro.js
 * Full Pomodoro timer with:
 *  - Focus / Short Break / Long Break modes
 *  - Auto-advance between sessions
 *  - Session logging to IndexedDB
 *  - Browser notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSettings, addFocusSession } from '../store/storage'

export function usePomodoro() {
  const settings = getSettings()
  const FOCUS_SECS   = (settings.pomodoroFocus || 25) * 60
  const BREAK_SECS   = (settings.pomodoroBreak || 5) * 60
  const LONG_SECS    = (settings.pomodoroLongBreak || 15) * 60
  const SESSIONS_PER_LONG = settings.pomodoroSessions || 4

  const [mode, setMode]           = useState('focus')   // 'focus' | 'break' | 'long'
  const [secs, setSecs]           = useState(FOCUS_SECS)
  const [running, setRunning]     = useState(false)
  const [session, setSession]     = useState(0)          // completed focus sessions
  const [taskName, setTaskName]   = useState('Free Focus')
  const [todayMins, setTodayMins] = useState(0)
  const [log, setLog]             = useState([])         // today's session log

  const intervalRef   = useRef(null)
  const startTimeRef  = useRef(null)

  // Total seconds for current mode
  const totalSecs = mode === 'focus' ? FOCUS_SECS : mode === 'break' ? BREAK_SECS : LONG_SECS

  // Ring progress (0–1)
  const progress = 1 - secs / totalSecs

  // Human-readable display
  const display = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  const notify = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/pwa-192x192.png' })
    }
  }, [])

  const requestNotifPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  // Session completed
  const onSessionEnd = useCallback(async () => {
    clearInterval(intervalRef.current)
    setRunning(false)

    if (mode === 'focus') {
      const durationMins = Math.round((FOCUS_SECS - secs) / 60) || settings.pomodoroFocus || 25
      const entry = {
        taskName,
        durationMins,
        startTime: startTimeRef.current,
        endTime: Date.now(),
      }

      // Log to IndexedDB
      await addFocusSession(entry)

      setLog(prev => [...prev, entry])
      setTodayMins(prev => prev + durationMins)
      setSession(prev => {
        const next = prev + 1
        if (next % SESSIONS_PER_LONG === 0) {
          setMode('long'); setSecs(LONG_SECS)
          notify('Long Break! 🎉', `Great work on ${taskName}! Take ${settings.pomodoroLongBreak || 15} minutes.`)
        } else {
          setMode('break'); setSecs(BREAK_SECS)
          notify('Short Break ☕', `${taskName} session done! Rest for ${settings.pomodoroBreak || 5} minutes.`)
        }
        return next
      })
    } else {
      setMode('focus'); setSecs(FOCUS_SECS)
      notify('Focus Time 🍅', `Break over! Time to work on ${taskName}.`)
    }
  }, [mode, secs, taskName, FOCUS_SECS, BREAK_SECS, LONG_SECS, SESSIONS_PER_LONG, settings])

  // Tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(prev => {
          if (prev <= 1) {
            onSessionEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, onSessionEnd])

  const toggle = useCallback(() => {
    if (!running) startTimeRef.current = Date.now()
    setRunning(r => !r)
    requestNotifPermission()
  }, [running, requestNotifPermission])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setMode('focus')
    setSecs(FOCUS_SECS)
  }, [FOCUS_SECS])

  const skip = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    if (mode === 'focus') {
      setMode('break'); setSecs(BREAK_SECS)
    } else {
      setMode('focus'); setSecs(FOCUS_SECS)
    }
  }, [mode, FOCUS_SECS, BREAK_SECS])

  return {
    mode, secs, running, session, taskName, setTaskName,
    display, progress, totalSecs, todayMins, log,
    toggle, reset, skip,
  }
}
