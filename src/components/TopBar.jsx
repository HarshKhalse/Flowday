const PAGE_TITLES = {
  today: "Today's Schedule", week: 'This Week', month: 'Month View',
  pomodoro: 'Pomodoro Timer', reports: 'Focus Reports', tasks: 'All Tasks',
  upload: 'Upload Timetable', settings: 'Settings',
}

export default function TopBar({ page, onNavigate, onAIToggle }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0,
      paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="topbar-title" style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>
          {PAGE_TITLES[page]}
        </div>
        <div className="topbar-date" style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dateStr}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* View switcher — desktop only */}
        {['today','week','month'].includes(page) && (
          <div className="topbar-view-toggle" style={{
            display: 'flex', background: 'var(--bg3)',
            borderRadius: 'var(--r-md)', padding: 3, gap: 2,
          }}>
            {['today','week','month'].map(v => (
              <button key={v} onClick={() => onNavigate(v)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 12,
                fontWeight: page === v ? 600 : 400,
                color: page === v ? '#fff' : 'var(--text2)',
                background: page === v ? 'var(--accent)' : 'transparent',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{v}</button>
            ))}
          </div>
        )}

        {/* AI button — desktop only (mobile has FAB) */}
        <button
          className="topbar-ai-btn"
          onClick={onAIToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--accent)', color: '#fff',
            fontSize: 12, fontWeight: 600,
            boxShadow: 'var(--shadow-accent)',
          }}
        >🤖 AI Assistant</button>
      </div>
    </header>
  )
}
