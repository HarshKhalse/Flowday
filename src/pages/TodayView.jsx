import { useState, useEffect } from 'react'
import { getSchedule, getTasks, getStreak } from '../store/storage'

const PRIORITY_COLOR = { critical: '#e74c3c', high: '#f39c12', medium: '#3498db', low: '#2ecc71' }
const PRIORITY_LABEL = { critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium', low: '🟢 Low' }

function PomodoroRing({ pomo, size = 96 }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const offset = circ - pomo.progress * circ
  const strokeColor = pomo.mode === 'focus' ? 'var(--accent)' : pomo.mode === 'break' ? 'var(--green)' : 'var(--amber)'

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 10px' }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--bg4)" strokeWidth={8} />
        <circle cx={50} cy={50} r={r} fill="none"
          stroke={strokeColor} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: size > 100 ? 20 : 16, fontWeight: 500 }}>{pomo.display}</div>
        <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>{pomo.mode}</div>
      </div>
    </div>
  )
}

// Mobile compact widget row (shown instead of right column on mobile)
function MobileWidgets({ pomo, streak, tasks, onPageChange }) {
  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '0 14px 10px',
      overflowX: 'auto', flexShrink: 0,
    }}>
      {/* Progress pill */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '10px 14px',
        flexShrink: 0, minWidth: 130,
      }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Day progress</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>{done}/{total} tasks</span>
          <span style={{ color: 'var(--accent2)' }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2 }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 'var(--r-full)',
            background: 'rgba(243,156,18,0.12)', color: 'var(--amber)',
            border: '1px solid rgba(243,156,18,0.25)',
          }}>🔥 {streak.count} day streak</span>
        </div>
      </div>

      {/* Pomodoro mini card */}
      <div onClick={() => onPageChange('pomodoro')} style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '10px 14px',
        flexShrink: 0, minWidth: 130, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6 }}>🍅 Pomodoro</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
          color: pomo.running ? 'var(--accent2)' : 'var(--text)',
        }}>{pomo.display}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textTransform: 'uppercase' }}>{pomo.mode}</div>
        <button onClick={e => { e.stopPropagation(); pomo.toggle() }} style={{
          marginTop: 8, width: 34, height: 34, borderRadius: '50%',
          background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14,
        }}>{pomo.running ? '⏸' : '▶'}</button>
      </div>

      {/* Critical tasks */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '10px 14px',
        flexShrink: 0, minWidth: 160,
      }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>🔴 Critical today</div>
        {tasks.filter(t => t.priority === 'critical' && !t.done).slice(0, 2).map(t => (
          <div key={t.id} style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
          </div>
        ))}
        {tasks.filter(t => t.priority === 'critical' && !t.done).length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--green)' }}>All clear! 🎉</div>
        )}
      </div>
    </div>
  )
}

export default function TodayView({ pomo, onPageChange }) {
  const [schedule, setSchedule] = useState([])
  const [tasks, setTasks]       = useState([])
  const [streak, setStreak]     = useState({ count: 7 })
  const [now, setNow]           = useState(new Date())

  useEffect(() => {
    setSchedule(getSchedule())
    setTasks(getTasks())
    setStreak(getStreak())
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const pct        = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
  const upcoming   = schedule.filter(s => {
    const [h, m] = s.time.split(':').map(Number)
    return h > now.getHours() || (h === now.getHours() && m > now.getMinutes())
  }).slice(0, 3)
  const nowMins = now.getHours() * 60 + now.getMinutes()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mobile-only horizontal widget strip */}
      <div style={{ display: 'none' }} className="mobile-widgets-show">
        <MobileWidgets pomo={pomo} streak={streak} tasks={tasks} onPageChange={onPageChange} />
      </div>

      <div className="page-scroll responsive-row" style={{ flex: 1, display: 'flex', gap: 16, padding: '16px', overflow: 'auto' }}>

        {/* LEFT: Schedule timeline */}
        <div className="responsive-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {schedule.map((item) => {
            const [sh, sm] = item.time.split(':').map(Number)
            const itemMins = sh * 60 + sm
            const [eh, em] = item.end.split(':').map(Number)
            const endMins  = eh * 60 + em
            const isNow    = nowMins >= itemMins && nowMins < endMins
            const isPast   = nowMins >= endMins
            const priColor = PRIORITY_COLOR[item.priority] || 'var(--accent)'

            return (
              <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div className="time-label-col" style={{
                  width: 44, paddingTop: 10, flexShrink: 0,
                  fontSize: 10, color: 'var(--text3)',
                  fontFamily: 'var(--font-mono)', textAlign: 'right',
                }}>{item.time}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isNow && (
                    <div style={{ height: 2, background: 'var(--red)', borderRadius: 1, marginBottom: 4, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 4, top: -8, fontSize: 9, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>NOW</span>
                    </div>
                  )}
                  <div className="task-row" style={{
                    borderRadius: 'var(--r-md)', padding: '10px 12px',
                    borderLeft: `3px solid ${priColor}`,
                    background: `${priColor}0d`,
                    opacity: isPast ? 0.5 : 1,
                    cursor: 'pointer', transition: 'transform 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 500,
                        background: `${item.color}22`, color: item.color,
                      }}>{item.type}</span>
                      {item.room && <span>📍 {item.room}</span>}
                      <span>{item.time}–{item.end}</span>
                      {(item.priority === 'critical' || item.priority === 'high') && (
                        <span style={{ color: priColor }}>{PRIORITY_LABEL[item.priority]}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT: Desktop widgets */}
        <div className="today-widgets-col" style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📈 At a glance</div>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { n: totalTasks, l: 'Tasks' },
                { n: schedule.filter(s => s.type === 'lecture').length, l: 'Lectures' },
                { n: tasks.filter(t => t.priority === 'critical' && !t.done).length, l: 'Critical' },
                { n: doneTasks, l: 'Done' },
              ].map(({ n, l }) => (
                <div key={l} style={{ background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>{n}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
              <span>Day progress</span><span style={{ color: 'var(--accent2)' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 2 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 'var(--r-full)',
                background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.3)',
                color: 'var(--amber)', fontWeight: 500,
              }}>🔥 {streak.count} day streak</span>
            </div>
          </div>

          {/* Pomodoro */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🍅 Pomodoro</div>
            <PomodoroRing pomo={pomo} size={96} />
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{pomo.taskName}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < (pomo.session % 4) ? 'var(--accent)' : 'var(--bg4)',
                  border: '1px solid var(--border2)',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[['⏮', pomo.reset], [pomo.running ? '⏸' : '▶', pomo.toggle], ['⏭', pomo.skip]].map(([label, fn]) => (
                <button key={label} onClick={fn} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: (label === '▶' || label === '⏸') ? 'var(--accent)' : 'var(--bg3)',
                  border: `1px solid ${(label === '▶' || label === '⏸') ? 'var(--accent)' : 'var(--border2)'}`,
                  color: (label === '▶' || label === '⏸') ? '#fff' : 'var(--text2)',
                  fontSize: 11,
                }}>{label}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <button onClick={() => onPageChange('pomodoro')} style={{
                fontSize: 11, color: 'var(--accent2)', cursor: 'pointer', textDecoration: 'underline',
              }}>Open full timer →</button>
            </div>
          </div>

          {/* Up next */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>⚡ Up Next</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 12 }}>All done today! 🎉</div>
              )}
              {upcoming.map(item => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: 8, background: 'var(--bg3)', borderRadius: 'var(--r-md)',
                  borderLeft: `2px solid ${PRIORITY_COLOR[item.priority] || 'var(--accent)'}`,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', width: 36 }}>{item.time}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>{item.time}–{item.end}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
