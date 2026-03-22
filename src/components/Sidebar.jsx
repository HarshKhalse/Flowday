import { getDailyQuote } from '../utils/quotes'

const NAV = [
  { id: 'today',    icon: '📅', label: 'Today' },
  { id: 'week',     icon: '📆', label: 'This Week' },
  { id: 'month',    icon: '🗓️', label: 'Month View' },
  null,
  { id: 'pomodoro', icon: '🍅', label: 'Pomodoro' },
  { id: 'reports',  icon: '📊', label: 'Reports' },
  null,
  { id: 'tasks',    icon: '✅', label: 'All Tasks' },
  { id: 'upload',   icon: '📤', label: 'Upload Timetable' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

const quote = getDailyQuote()

export default function Sidebar({ activePage, onNavigate, pomo }) {
  return (
    <nav className="sidebar" style={{
      width: 220, flexShrink: 0,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 0',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div className="logo" style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, background: 'var(--accent)',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}>⚡</div>
        <span className="logo-text" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
          Flow<span style={{ color: 'var(--accent2)' }}>Day</span>
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {NAV.map((item, i) => {
          if (!item) return (
            <div key={i} style={{ height: 1, background: 'var(--border)', margin: '8px 8px' }} />
          )
          const active = activePage === item.id
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--r-md)',
                cursor: 'pointer', fontSize: 13, marginBottom: 2,
                color: active ? 'var(--accent2)' : 'var(--text2)',
                background: active ? 'rgba(124,106,245,0.12)' : 'transparent',
                border: active ? '1px solid rgba(124,106,245,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <span className="nav-icon" style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {item.id === 'pomodoro' && pomo.running && (
                <span className="nav-badge" style={{
                  marginLeft: 'auto',
                  background: 'var(--red2)', border: '1px solid rgba(231,76,60,0.3)',
                  color: 'var(--red)', fontSize: 10, padding: '1px 6px',
                  borderRadius: 'var(--r-full)', fontFamily: 'var(--font-mono)',
                }}>{pomo.display}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Daily quote */}
      <div className="sidebar-footer" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--bg3)', borderRadius: 'var(--r-md)',
          padding: '10px 12px', borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{quote.text}"
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>— {quote.author}</div>
        </div>
      </div>
    </nav>
  )
}
