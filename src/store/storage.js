/**
 * storage.js
 * Unified storage layer:
 *  - localStorage  → tasks, schedule, settings, pomodoro config  (sync, simple KV)
 *  - IndexedDB     → focus sessions, timetable blobs, reports     (async, structured)
 */

import { openDB } from 'idb'

const DB_NAME = 'flowday-db'
const DB_VERSION = 1

// ── IndexedDB setup ──────────────────────────────────────────────────────────
let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Focus sessions: { id, taskName, startTime, endTime, durationMins, date }
      if (!db.objectStoreNames.contains('sessions')) {
        const s = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
        s.createIndex('date', 'date')
        s.createIndex('taskName', 'taskName')
      }
      // Timetable parsed data: { id, uploadedAt, raw (base64 img/pdf), parsed (JSON schedule) }
      if (!db.objectStoreNames.contains('timetable')) {
        db.createObjectStore('timetable', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
  return _db
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEYS = {
  TASKS:    'fd_tasks',
  SCHEDULE: 'fd_schedule',
  SETTINGS: 'fd_settings',
  POMO_CFG: 'fd_pomo_cfg',
  STREAK:   'fd_streak',
}

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) {
    console.warn('localStorage write failed:', e)
  }
}

// ── Default seed data ────────────────────────────────────────────────────────
const DEFAULT_TASKS = [
  { id: 't1', title: 'Submit DSA Assignment', due: 'Today', dueDate: new Date().toISOString().split('T')[0], priority: 'critical', done: false, tag: 'Assignment', createdAt: Date.now() },
  { id: 't2', title: 'OS Exam Preparation', due: 'Tomorrow', dueDate: '', priority: 'critical', done: false, tag: 'Study', createdAt: Date.now() },
  { id: 't3', title: 'DBMS Project Phase 2', due: 'Mar 20', dueDate: '', priority: 'high', done: false, tag: 'Project', createdAt: Date.now() },
  { id: 't4', title: 'CN Lab Report', due: 'Mar 21', dueDate: '', priority: 'high', done: false, tag: 'Assignment', createdAt: Date.now() },
  { id: 't5', title: 'Math Assignment', due: 'Mar 22', dueDate: '', priority: 'high', done: false, tag: 'Assignment', createdAt: Date.now() },
  { id: 't6', title: 'Read Chapter 6 – OS', due: 'Mar 19', dueDate: '', priority: 'medium', done: true, tag: 'Study', createdAt: Date.now() },
  { id: 't7', title: 'Push CN code to GitHub', due: 'Mar 23', dueDate: '', priority: 'medium', done: false, tag: 'Project', createdAt: Date.now() },
  { id: 't8', title: 'Book library study room', due: 'Mar 18', dueDate: '', priority: 'low', done: false, tag: 'Personal', createdAt: Date.now() },
]

const DEFAULT_SCHEDULE = [
  { id: 's1', time: '08:00', end: '09:30', title: 'Operating Systems', type: 'lecture', priority: 'medium', room: 'LH-3', day: 'daily', color: '#3498db' },
  { id: 's2', time: '09:45', end: '10:15', title: 'Breakfast Break', type: 'break', priority: 'low', room: '', day: 'daily', color: '#2ecc71' },
  { id: 's3', time: '10:30', end: '12:00', title: 'Data Structures & Algorithms', type: 'lecture', priority: 'medium', room: 'LH-1', day: 'daily', color: '#3498db' },
  { id: 's4', time: '12:00', end: '13:00', title: 'Lunch Break', type: 'break', priority: 'low', room: 'Canteen', day: 'daily', color: '#2ecc71' },
  { id: 's5', time: '13:00', end: '14:30', title: 'DSA Assignment', type: 'study', priority: 'critical', room: 'Library', day: 'daily', color: '#e74c3c' },
  { id: 's6', time: '14:30', end: '15:00', title: 'Short Break', type: 'break', priority: 'low', room: '', day: 'daily', color: '#2ecc71' },
  { id: 's7', time: '15:00', end: '17:00', title: 'DBMS Project Work', type: 'project', priority: 'high', room: 'Lab-2', day: 'daily', color: '#f39c12' },
  { id: 's8', time: '17:00', end: '18:00', title: 'OS Exam Revision', type: 'study', priority: 'high', room: '', day: 'daily', color: '#a89cf8' },
  { id: 's9', time: '19:00', end: '20:00', title: 'CN Assignment', type: 'project', priority: 'medium', room: '', day: 'daily', color: '#f39c12' },
]

const DEFAULT_SETTINGS = {
  name: 'Harsh',
  college: 'Engineering College',
  semester: '3rd Year',
  pomodoroFocus: 25,
  pomodoroBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroSessions: 4,
  notificationsEnabled: true,
  claudeApiKey: '', // user sets this for AI features
}

// ── Public API ───────────────────────────────────────────────────────────────

// Tasks (localStorage)
export function getTasks() {
  return lsGet(LS_KEYS.TASKS, DEFAULT_TASKS)
}
export function saveTasks(tasks) {
  lsSet(LS_KEYS.TASKS, tasks)
}
export function addTask(task) {
  const tasks = getTasks()
  const newTask = { ...task, id: 't' + Date.now(), createdAt: Date.now(), done: false }
  saveTasks([newTask, ...tasks])
  return newTask
}
export function updateTask(id, updates) {
  const tasks = getTasks().map(t => t.id === id ? { ...t, ...updates } : t)
  saveTasks(tasks)
}
export function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id))
}

// Schedule (localStorage)
export function getSchedule() {
  return lsGet(LS_KEYS.SCHEDULE, DEFAULT_SCHEDULE)
}
export function saveSchedule(schedule) {
  lsSet(LS_KEYS.SCHEDULE, schedule)
}
export function addScheduleItem(item) {
  const schedule = getSchedule()
  const newItem = { ...item, id: 's' + Date.now() }
  const sorted = [...schedule, newItem].sort((a, b) => a.time.localeCompare(b.time))
  saveSchedule(sorted)
  return newItem
}
export function updateScheduleItem(id, updates) {
  saveSchedule(getSchedule().map(s => s.id === id ? { ...s, ...updates } : s))
}
export function deleteScheduleItem(id) {
  saveSchedule(getSchedule().filter(s => s.id !== id))
}

// Settings (localStorage)
export function getSettings() {
  return lsGet(LS_KEYS.SETTINGS, DEFAULT_SETTINGS)
}
export function saveSettings(settings) {
  lsSet(LS_KEYS.SETTINGS, settings)
}

// Streak (localStorage)
export function getStreak() {
  return lsGet(LS_KEYS.STREAK, { count: 7, lastDate: new Date().toISOString().split('T')[0] })
}
export function updateStreak() {
  const today = new Date().toISOString().split('T')[0]
  const streak = getStreak()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (streak.lastDate === today) return streak
  const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1
  const updated = { count: newCount, lastDate: today }
  lsSet(LS_KEYS.STREAK, updated)
  return updated
}

// Focus Sessions (IndexedDB)
export async function addFocusSession(session) {
  const db = await getDB()
  const id = await db.add('sessions', {
    ...session,
    date: new Date().toISOString().split('T')[0],
    endTime: Date.now(),
  })
  return id
}

export async function getSessionsForDate(date) {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'date', date)
}

export async function getSessionsRange(startDate, endDate) {
  const db = await getDB()
  const all = await db.getAll('sessions')
  return all.filter(s => s.date >= startDate && s.date <= endDate)
}

export async function getWeeklyStats() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().split('T')[0])
  }
  const db = await getDB()
  const all = await db.getAll('sessions')
  return days.map(date => {
    const daySessions = all.filter(s => s.date === date)
    const totalMins = daySessions.reduce((sum, s) => sum + (s.durationMins || 0), 0)
    return { date, hours: Math.round((totalMins / 60) * 10) / 10, sessions: daySessions.length }
  })
}

export async function getMonthlyStats() {
  const db = await getDB()
  const all = await db.getAll('sessions')
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const daySessions = all.filter(s => s.date === date)
    const totalMins = daySessions.reduce((sum, s) => sum + (s.durationMins || 0), 0)
    return { day: i + 1, date, hours: Math.round((totalMins / 60) * 10) / 10 }
  })
}

// Timetable upload (IndexedDB)
export async function saveTimetable(parsed) {
  const db = await getDB()
  await db.clear('timetable')
  return db.add('timetable', { parsed, uploadedAt: Date.now() })
}

export async function getLatestTimetable() {
  const db = await getDB()
  const all = await db.getAll('timetable')
  return all[all.length - 1] || null
}

// Seed demo focus sessions if DB is empty
export async function seedDemoSessions() {
  const db = await getDB()
  const existing = await db.count('sessions')
  if (existing > 0) return
  const tasks = ['DSA Assignment', 'Operating Systems', 'DBMS Project', 'CN Lab', 'Math Revision']
  const now = Date.now()
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 86400000).toISOString().split('T')[0]
    const sessionCount = Math.floor(Math.random() * 5)
    for (let j = 0; j < sessionCount; j++) {
      await db.add('sessions', {
        taskName: tasks[Math.floor(Math.random() * tasks.length)],
        durationMins: 25,
        date,
        startTime: now - i * 86400000 + j * 1800000,
        endTime: now - i * 86400000 + j * 1800000 + 1500000,
      })
    }
  }
}
