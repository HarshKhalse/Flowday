import { useState, useRef } from 'react'
import { useAI } from '../hooks/useAI'
import { saveSchedule, getSchedule, saveTimetable } from '../store/storage'
import { useVoice } from '../hooks/useVoice'

export default function UploadView({ onImport }) {
  const [status, setStatus]   = useState(null)   // null | 'parsing' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [parsed, setParsed]   = useState([])
  const [voiceText, setVoiceText] = useState('')
  const fileRef = useRef(null)
  const { parseTimetable, loading } = useAI()

  const voice = useVoice({
    onResult: (text) => setVoiceText(text),
    onError:  (err)  => setVoiceText('Error: ' + err),
  })

  const handleFile = async (file) => {
    if (!file) return
    setStatus('parsing')
    setProgress(0)
    setMessage(`Analyzing "${file.name}"...`)

    // Animate progress bar
    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 6, 90))
    }, 120)

    const result = await parseTimetable(file)
    clearInterval(iv)
    setProgress(100)

    if (result.success && result.schedule.length > 0) {
      setParsed(result.schedule)
      setStatus('success')
      setMessage(result.message)
    } else {
      setStatus('error')
      setMessage(result.message || 'Could not parse timetable.')
    }
  }

  const applySchedule = async () => {
    const existing = getSchedule().filter(s => s.type !== 'lecture')
    const newItems = parsed.map(s => ({ ...s, id: 's' + Date.now() + Math.random() }))
    saveSchedule([...existing, ...newItems].sort((a, b) => a.time.localeCompare(b.time)))
    await saveTimetable(parsed)
    setStatus(null)
    setParsed([])
    onImport()
    setMessage('Schedule updated successfully! 🎉')
    setStatus('success')
    setTimeout(() => { setStatus(null); setMessage('') }, 3000)
  }

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const VOICE_EXAMPLES = [
    'Add DSA assignment due tomorrow at 5 PM, high priority',
    'Move today\'s 3 PM study session to 5 PM',
    'Cancel tomorrow\'s lab session and reschedule',
    'Start a 25 minute Pomodoro for DBMS project',
    'Add Operating Systems lecture every Monday 9 AM to 10:30 AM',
    'Mark my Math assignment as done',
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 1000, margin: '0 auto' }}>

        {/* Upload card */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>📤 Upload Your Timetable</div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
              onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onDrop={onDrop}
              style={{
                border: '2px dashed var(--border2)',
                borderRadius: 'var(--r-lg)',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg3)',
                transition: 'all 0.2s',
                marginBottom: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(124,106,245,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)' }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop your timetable here</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>or click to browse</div>
              <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 8 }}>Supports PDF, JPG, PNG</div>
              <input
                ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {/* Status */}
            {status === 'parsing' && (
              <div style={{ padding: 14, background: 'var(--bg3)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: 12, color: 'var(--accent2)', marginBottom: 8 }}>⏳ {message}</div>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.1s' }} />
                </div>
              </div>
            )}

            {status === 'success' && parsed.length === 0 && (
              <div style={{ padding: 14, background: 'rgba(46,204,113,0.08)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--green)' }}>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>✅ {message}</div>
              </div>
            )}

            {status === 'error' && (
              <div style={{ padding: 14, background: 'rgba(231,76,60,0.08)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--red)' }}>
                <div style={{ fontSize: 12, color: 'var(--red)' }}>❌ {message}</div>
              </div>
            )}

            {/* Parsed preview */}
            {parsed.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>✨ Found {parsed.length} classes — review before applying:</div>
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {parsed.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'center',
                      padding: '7px 10px', background: 'var(--bg3)', borderRadius: 'var(--r-md)',
                      borderLeft: '2px solid var(--blue)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', width: 40 }}>{s.time}</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{s.title}</span>
                      {s.room && <span style={{ fontSize: 11, color: 'var(--text3)' }}>📍 {s.room}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setParsed([]); setStatus(null) }} style={{
                    flex: 1, padding: 10, borderRadius: 'var(--r-md)',
                    background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer',
                  }}>Discard</button>
                  <button onClick={applySchedule} style={{
                    flex: 1, padding: 10, borderRadius: 'var(--r-md)',
                    background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  }}>Apply to Schedule</button>
                </div>
              </div>
            )}

            {/* Tip */}
            {!status && (
              <div style={{ padding: 12, background: 'var(--bg3)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
                  💡 <strong>How it works:</strong> Upload a clear photo or PDF of your college timetable. The AI reads all subject names, timings, room numbers, and builds your weekly schedule automatically.
                  <br /><br />
                  Add your Claude API key in <strong>Settings</strong> to enable real AI parsing.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice commands card */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>🎙️ Voice Commands</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--r-lg)', marginBottom: 16 }}>
              <button
                onClick={voice.toggle}
                style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: voice.listening ? 'rgba(231,76,60,0.15)' : 'var(--bg4)',
                  border: `2px solid ${voice.listening ? 'var(--red)' : 'var(--border2)'}`,
                  fontSize: 22, cursor: 'pointer',
                  animation: voice.listening ? 'pulse 1s infinite' : 'none',
                }}
              >🎙️</button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {voice.listening ? '🔴 Listening...' : 'Tap to speak'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {voice.supported ? 'Chrome/Edge supported' : 'Use text input instead'}
                </div>
              </div>
            </div>

            {voiceText && (
              <div style={{ padding: 12, background: 'rgba(124,106,245,0.08)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--accent)', marginBottom: 14, fontSize: 12, color: 'var(--text2)' }}>
                🎤 Heard: "{voiceText}"
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Try saying:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VOICE_EXAMPLES.map((ex, i) => (
                <div
                  key={i}
                  onClick={() => setVoiceText(ex)}
                  style={{
                    padding: '9px 12px', background: 'var(--bg3)',
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg4)'; e.currentTarget.style.borderLeft = '2px solid var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.borderLeft = '2px solid transparent' }}
                >
                  <div style={{ fontSize: 12, color: 'var(--accent2)', fontStyle: 'italic' }}>"{ex}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
