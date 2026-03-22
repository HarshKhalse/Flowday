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

export default function SettingsView() {
  const [form, setForm]   = useState(getSettings())
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => { setForm(getSettings()) }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        <Section title="👤 Profile">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

        <Section title="🍅 Pomodoro Settings">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Focus Duration (min)">
              <input type="number" min={5} max={90} value={form.pomodoroFocus} onChange={e => set('pomodoroFocus', +e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="Short Break (min)">
              <input type="number" min={1} max={30} value={form.pomodoroBreak} onChange={e => set('pomodoroBreak', +e.target.value)} style={{ width: '100%' }} />
            </Field>
            <Field label="Long Break (min)">
              <input type="number" min={5} max={60} value={form.pomodoroLongBreak} onChange={e => set('pomodoroLongBreak', +e.target.value)} style={{ width: '100%' }} />
            </Field>
          </div>
          <Field label="Sessions before Long Break">
            <input type="number" min={2} max={8} value={form.pomodoroSessions} onChange={e => set('pomodoroSessions', +e.target.value)} style={{ width: 80 }} />
          </Field>
        </Section>

        <Section title="🤖 AI Assistant (Claude API)">
          <Field
            label="Claude API Key"
            hint="Get your key at console.anthropic.com → API Keys. Stored locally, never sent anywhere except Anthropic's API."
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={form.claudeApiKey}
                onChange={e => set('claudeApiKey', e.target.value)}
                placeholder="sk-ant-..."
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              <button
                onClick={() => setShowKey(s => !s)}
                style={{ padding: '0 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}
              >{showKey ? '🙈' : '👁️'}</button>
            </div>
          </Field>
          <div style={{ padding: 12, background: 'rgba(124,106,245,0.06)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)', fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
            <strong>Without API key:</strong> App works fully offline with rule-based AI responses.<br />
            <strong>With API key:</strong> Full natural language scheduling — "Add ML assignment due Thursday, critical" — and timetable image parsing.
          </div>
        </Section>

        <Section title="🔔 Notifications">
          <Field label="Browser Notifications">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                onClick={() => set('notificationsEnabled', !form.notificationsEnabled)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: form.notificationsEnabled ? 'var(--accent)' : 'var(--bg4)',
                  border: '1px solid var(--border2)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: form.notificationsEnabled ? 22 : 3,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {form.notificationsEnabled ? 'Enabled — get Pomodoro & deadline alerts' : 'Disabled'}
              </span>
            </div>
          </Field>
        </Section>

        <Section title="💾 Data & Storage">
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 14 }}>
            <div>📦 <strong>Tasks & Schedule</strong> → localStorage (browser, offline)</div>
            <div>📊 <strong>Focus Sessions & Reports</strong> → IndexedDB (browser, offline)</div>
            <div>🔑 <strong>API Key</strong> → localStorage (browser only, not synced)</div>
            <div>☁️ <strong>Cross-device sync</strong> → Not enabled (add Supabase/Firebase to unlock)</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const data = {
                  tasks: JSON.parse(localStorage.getItem('fd_tasks') || '[]'),
                  schedule: JSON.parse(localStorage.getItem('fd_schedule') || '[]'),
                  settings: JSON.parse(localStorage.getItem('fd_settings') || '{}'),
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = 'flowday-backup.json'; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}
            >⬇️ Export Data (JSON)</button>
            <button
              onClick={() => {
                if (confirm('This clears ALL local data. Are you sure?')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              style={{ padding: '8px 14px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 'var(--r-md)', color: 'var(--red)', cursor: 'pointer', fontSize: 12 }}
            >🗑️ Clear All Data</button>
          </div>
        </Section>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <button
            onClick={save}
            style={{
              padding: '10px 28px', borderRadius: 'var(--r-md)',
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
