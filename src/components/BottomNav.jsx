// Bottom navigation bar — shown only on mobile via CSS
const NAV_ITEMS = [
  { id: 'today',    icon: '📅', label: 'Today'    },
  { id: 'tasks',    icon: '✅', label: 'Tasks'    },
  { id: 'pomodoro', icon: '🍅', label: 'Focus'    },
  { id: 'reports',  icon: '📊', label: 'Reports'  },
  { id: 'settings', icon: '⚙️', label: 'More'     },
]

export default function BottomNav({ activePage, onNavigate, pomo }) {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`bottom-nav-item${activePage === item.id ? ' active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-label={item.label}
          aria-current={activePage === item.id ? 'page' : undefined}
        >
          <span className="bn-icon" style={{ position: 'relative' }}>
            {item.icon}
            {/* Live timer badge on Pomodoro tab */}
            {item.id === 'pomodoro' && pomo.running && (
              <span style={{
                position: 'absolute', top: -4, right: -8,
                background: 'var(--red)', color: '#fff',
                fontSize: 8, padding: '1px 4px',
                borderRadius: 'var(--r-full)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.4,
                minWidth: 28,
                textAlign: 'center',
              }}>{pomo.display}</span>
            )}
          </span>
          <span className="bn-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
