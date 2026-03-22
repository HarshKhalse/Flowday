import { useState, useRef, useEffect } from 'react'
import { useAI } from '../hooks/useAI'
import { useVoice } from '../hooks/useVoice'

export default function AIChat({ open, onClose, onScheduleChange }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Hey Harsh! 👋 I'm your AI scheduler. Tell me what to add, change, or reschedule — or tap the mic to speak!" }
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const { sendMessage, loading } = useAI()

  const addMsg = (from, text) => setMessages(m => [...m, { from, text }])

  const voice = useVoice({
    onResult: (text) => { setInput(text); send(text) },
    onError:  (err)  => addMsg('ai', `🎙️ ${err}`),
  })

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    addMsg('user', msg)
    const result = await sendMessage(msg)
    addMsg('ai', result.message)
    if (result.action && result.action !== 'none') onScheduleChange()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened on desktop
  useEffect(() => {
    if (open) {
      const isMobile = window.innerWidth <= 768
      if (!isMobile) setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 199,
          display: window.innerWidth <= 768 ? 'block' : 'none',
        }}
      />

      <div
        className="ai-chat-panel"
        style={{
          position: 'fixed', bottom: 20, right: 20,
          width: 340,
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 440,
          zIndex: 200,
          animation: 'slideUp 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, flex: 1 }}>FlowDay AI</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
            Online
          </div>
          <button onClick={onClose} style={{ color: 'var(--text3)', fontSize: 20, marginLeft: 8, padding: '0 4px' }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <div key={i} className="animate-up" style={{
              maxWidth: '85%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
              borderRadius: m.from === 'ai' ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
              alignSelf: m.from === 'ai' ? 'flex-start' : 'flex-end',
              background: m.from === 'ai' ? 'var(--bg3)' : 'var(--accent3)',
              color: m.from === 'ai' ? 'var(--text)' : 'var(--accent2)',
            }}>{m.text}</div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start', padding: '8px 14px',
              background: 'var(--bg3)', borderRadius: '12px 12px 12px 4px',
              fontSize: 16, color: 'var(--text3)', letterSpacing: 3,
            }}>
              <span style={{ animation: 'blink 1s infinite' }}>●●●</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['Add task', 'My schedule', 'Start Pomodoro'].map(s => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '4px 10px', borderRadius: 'var(--r-full)',
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              color: 'var(--text2)', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
            }}>{s}</button>
          ))}
        </div>

        {/* Input row */}
        <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            onClick={voice.toggle}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: voice.listening ? 'var(--red2)' : 'var(--bg3)',
              border: `1px solid ${voice.listening ? 'var(--red)' : 'var(--border2)'}`,
              fontSize: 16,
              animation: voice.listening ? 'pulse 1s infinite' : 'none',
            }}
          >🎙️</button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask me anything..."
            rows={1}
            style={{ flex: 1, resize: 'none', fontSize: 14, padding: '8px 10px', lineHeight: 1.4 }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)', flexShrink: 0,
              background: input.trim() ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${input.trim() ? 'var(--accent)' : 'var(--border)'}`,
              color: input.trim() ? '#fff' : 'var(--text3)',
              fontSize: 16, transition: 'all 0.15s',
            }}
          >➤</button>
        </div>
      </div>
    </>
  )
}
