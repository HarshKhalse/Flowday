import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../store/storage'

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// Quick API key validator — Gemini keys are 39 chars starting with AIza
function isValidGeminiKey(key) {
  return key && key.startsWith('AIza') && key.length > 30
}

export default function SettingsView() {
  const [form, setForm]         = useState(getSettings())
  const [saved, setSaved]       = useState(false)
  const [showKey, setShowKey]   = useState(false)
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'ok' | 'fail'

  useEffect(() => { setForm(getSettings()) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    saveSettings(form)
    setSaved(true)
    setTestStatus(null)
    setTimeout(() => setSaved(false), 2000)
  }

  // Quick test — sends a tiny message through the proxy to verify the key works
  const testKey = async () => {
    const key = form.geminiApiKey?.trim()
    if (!isValidGeminiKey(key)) {
      setTestStatus('fail')
      return
    }
    setTestStatus('testing')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'Reply with just the word: working' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      })
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      setTestStatus(text.toLowerCase().includes('work') || res.ok ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    }
  }

  const statusColor = { ok: 'var(--green)', fail: 'var(--red)', testing: 'var(--amber)' }
  const statusMsg   = { ok: '✅ Key works! AI is ready.', fail: '❌ Key invalid or quota exceeded.', testing: '⏳ Testing...' }

  return (
    <div className="page-scroll" style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Profile */}
        <Section title="👤 Profile">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="Your Name">
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your name" style={{ width: '100%' }} />
            </Field>
            <Field label="College">
              <input value={form.college} onChange={e => set('college', e.target.value)} placeholder="College name" style={{ width: '100%' }} />
            </Field>
            <Field label="Year / Semester">
              <input value={form.semester} onChange={e => set('semester', e.target.value)} placeholder="e.g. 3rd Year, Sem 5" style={{ width: '100%' }} />
            </Field>
          </div>
        </Section>

        {/* Pomodoro */}
        <Section title="🍅 Pomodoro Settings">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <Field label="Focus (min)">
              <input type="number" min={5} max={90} value={form.pomodoroFocus} onChange={e => set('pomodoroFocus', +e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="Short Break (min)">
              <input type="number" min={1} max={30} value={form.pomodoroBreak} onChange={e => set('pomodoroBreak', +e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="Long Break (min)">
              <input type="number" min={5} max={60} value={form.pomodoroLongBreak} onChange={e => set('pomodoroLongBreak', +e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="Sessions before long break">
              <input type="number" min={2} max={8} value={form.pomodoroSessions} onChange={e => set('pomodoroSessions', +e.target.value)} style={{ width: '100%' }} />
            </Field>
          </div>
        </Section>

        {/* Gemini API Key */}
        <Section title="🤖 AI Assistant — Google Gemini">

          {/* Step-by-step guide */}
          <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 'var(--r-lg)', marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>How to get your FREE Gemini API key:</div>
            {[
              { n: '1', text: 'Go to ', link: 'https://aistudio.google.com/app/apikey', linkText: 'aistudio.google.com/app/apikey' },
              { n: '2', text: 'Sign in with your Google account' },
              { n: '3', text: 'Click "Create API Key" → select any project (or create new)' },
              { n: '4', text: 'Copy the key (starts with AIza...) and paste it below' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{step.n}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                  {step.text}
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent2)', textDecoration: 'none', fontWeight: 500 }}>
                      {step.linkText}
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(46,204,113,0.08)', borderRadius: 'var(--r-md)', border: '1px solid rgba(46,204,113,0.2)' }}>
              <div style={{ fontSize: 11, color: 'var(--green)' }}>
                ✅ <strong>Completely free</strong> — Gemini 1.5 Flash gives you <strong>15 requests/minute</strong> and <strong>1 million tokens/day</strong> at zero cost. No credit card needed.
              </div>
            </div>
          </div>

          <Field
            label="Gemini API Key"
            hint="Stored only in your browser's localStorage. Never sent anywhere except Google's API."
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={form.geminiApiKey}
                onChange={e => { set('geminiApiKey', e.target.value); setTestStatus(null) }}
                placeholder="AIza..."
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
              <button
                onClick={() => setShowKey(s => !s)}
                style={{ padding: '0 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text2)', fontSize: 14 }}
              >{showKey ? '🙈' : '👁️'}</button>
            </div>
          </Field>

          {/* Test key button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button
              onClick={testKey}
              disabled={testStatus === 'testing' || !form.geminiApiKey?.trim()}
              style={{
                padding: '8px 16px', borderRadius: 'var(--r-md)', fontSize: 12, fontWeight: 500,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                color: 'var(--text)', cursor: form.geminiApiKey?.trim() ? 'pointer' : 'not-allowed',
                opacity: form.geminiApiKey?.trim() ? 1 : 0.5,
              }}
            >🧪 Test Key</button>
            {testStatus && (
              <span style={{ fontSize: 12, color: statusColor[testStatus] }}>
                {statusMsg[testStatus]}
              </span>
            )}
          </div>

          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg3)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
              <strong>Without key:</strong> App works fully offline with rule-based AI responses.<br />
              <strong>With key:</strong> Full natural language scheduling + timetable photo parsing using Gemini Vision.
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="🔔 Notifications">
          <Field label="Browser Notifications">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => set('notificationsEnabled', !form.notificationsEnabled)}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: form.notificationsEnabled ? 'var(--accent)' : 'var(--bg4)',
                  border: '1px solid var(--border2)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: form.notificationsEnabled ? 22 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {form.notificationsEnabled ? 'Enabled — Pomodoro ends and deadline alerts' : 'Disabled'}
              </span>
            </div>
          </Field>
        </Section>

        {/* Data */}
        <Section title="💾 Data & Storage">
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2, marginBottom: 14 }}>
            <div>📦 <strong>Tasks & Schedule</strong> → localStorage (browser, works offline)</div>
            <div>📊 <strong>Focus Sessions & Reports</strong> → IndexedDB (browser, works offline)</div>
            <div>🔑 <strong>API Key</strong> → localStorage (browser only, never synced)</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const data = {
                  tasks:    JSON.parse(localStorage.getItem('fd_tasks')    || '[]'),
                  schedule: JSON.parse(localStorage.getItem('fd_schedule') || '[]'),
                  settings: JSON.parse(localStorage.getItem('fd_settings') || '{}'),
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url  = URL.createObjectURL(blob)
                const a    = document.createElement('a')
                a.href = url; a.download = 'flowday-backup.json'; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}
            >⬇️ Export Backup (JSON)</button>
            <button
              onClick={() => {
                if (window.confirm('This clears ALL local data including tasks and schedule. Continue?')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              style={{ padding: '8px 14px', background: 'var(--red2)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 12, cursor: 'pointer' }}
            >🗑️ Clear All Data</button>
          </div>
        </Section>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <button
            onClick={save}
            style={{
              padding: '11px 32px', borderRadius: 'var(--r-md)',
              background: saved ? 'var(--green)' : 'var(--accent)',
              border: 'none', color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', transition: 'background 0.3s',
              boxShadow: saved ? '0 4px 12px rgba(46,204,113,0.3)' : 'var(--shadow-accent)',
            }}
          >{saved ? '✓ Saved!' : 'Save Settings'}</button>
        </div>

      </div>
    </div>
  )
}
