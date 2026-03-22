import { useState, useEffect } from 'react'
import { getTasks, addTask, updateTask, deleteTask } from '../store/storage'

const PRIORITY_COLOR = { critical: '#e74c3c', high: '#f39c12', medium: '#3498db', low: '#2ecc71' }
const PRIORITY_LABEL = { critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium', low: '🟢 Low' }

function AddTaskModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: '', due: '', priority: 'medium', tag: 'Study' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title.trim()) return
    onAdd(form); onClose()
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r-lg)', padding: 24, width: '100%', maxWidth: 380,
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add New Task</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Task Title *</label>
            <input autoFocus value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Complete OS assignment" style={{ width: '100%' }}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Due Date</label>
            <input type="date" value={form.due} onChange={e => set('due', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={{ width: '100%' }}>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Tag</label>
              <select value={form.tag} onChange={e => set('tag', e.target.value)} style={{ width: '100%' }}>
                {['Study','Assignment','Project','Lecture','Personal','Exam','Lab'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 'var(--r-md)',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text2)', cursor: 'pointer', fontSize: 14,
          }}>Cancel</button>
          <button onClick={submit} style={{
            flex: 1, padding: 12, borderRadius: 'var(--r-md)',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>Add Task</button>
        </div>
      </div>
    </div>
  )
}

export default function TasksView({ pomo, onPageChange }) {
  const [tasks, setTasks]     = useState([])
  const [filter, setFilter]   = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch]   = useState('')

  const reload = () => setTasks(getTasks())
  useEffect(() => { reload() }, [])

  const filtered = tasks
    .filter(t => filter === 'all' ? true : filter === 'done' ? t.done : t.priority === filter)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  const counts = {
    all:      tasks.length,
    critical: tasks.filter(t => t.priority === 'critical' && !t.done).length,
    high:     tasks.filter(t => t.priority === 'high'     && !t.done).length,
    medium:   tasks.filter(t => t.priority === 'medium'   && !t.done).length,
    low:      tasks.filter(t => t.priority === 'low'      && !t.done).length,
    done:     tasks.filter(t => t.done).length,
  }

  const handleAdd = (form) => {
    addTask({
      title: form.title,
      due: form.due ? new Date(form.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No due date',
      dueDate: form.due, priority: form.priority, tag: form.tag,
    })
    reload()
  }

  return (
    <div className="page-scroll" style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
      {showAdd && <AddTaskModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}

      {/* Filter row — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { key: 'all',      label: `All (${counts.all})`,              color: 'var(--accent)' },
          { key: 'critical', label: `🔴 (${counts.critical})`,          color: '#e74c3c' },
          { key: 'high',     label: `🟠 High (${counts.high})`,         color: '#f39c12' },
          { key: 'medium',   label: `🔵 Med (${counts.medium})`,        color: '#3498db' },
          { key: 'low',      label: `🟢 Low (${counts.low})`,           color: '#2ecc71' },
          { key: 'done',     label: `✅ Done (${counts.done})`,          color: '#888' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '6px 12px', borderRadius: 'var(--r-full)',
            fontSize: 12, cursor: 'pointer', flexShrink: 0,
            background: filter === f.key ? f.color + '22' : 'var(--bg3)',
            border: `1px solid ${filter === f.key ? f.color + '55' : 'var(--border)'}`,
            color: filter === f.key ? f.color : 'var(--text2)',
            fontWeight: filter === f.key ? 600 : 400,
          }}>{f.label}</button>
        ))}
      </div>

      {/* Search + Add row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search tasks..." style={{ flex: 1 }} />
        <button onClick={() => setShowAdd(true)} style={{
          padding: '0 16px', borderRadius: 'var(--r-md)',
          background: 'var(--accent)', border: 'none',
          color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          height: 44, flexShrink: 0, whiteSpace: 'nowrap',
        }}>+ Add</button>
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 14 }}>
            No tasks found. {filter === 'done' ? '🎉 Nothing done yet!' : 'Add one above!'}
          </div>
        )}
        {filtered.map(task => {
          const priColor = PRIORITY_COLOR[task.priority] || 'var(--accent)'
          return (
            <div key={task.id} className="task-row" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${priColor}`,
              borderRadius: 'var(--r-md)',
              opacity: task.done ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}>
              {/* Checkbox — large tap target */}
              <input type="checkbox" checked={task.done}
                onChange={() => { updateTask(task.id, { done: !task.done }); reload() }}
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
              />

              {/* Task info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 500,
                  textDecoration: task.done ? 'line-through' : 'none',
                  color: task.done ? 'var(--text3)' : 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{task.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
                  <span>📅 {task.due}</span>
                  {task.tag && (
                    <span style={{ padding: '1px 6px', borderRadius: 4, background: 'var(--accent4)', color: 'var(--accent2)', fontSize: 10 }}>{task.tag}</span>
                  )}
                </div>
              </div>

              {/* Priority — hidden on very small screens */}
              <span style={{ fontSize: 11, color: priColor, flexShrink: 0, display: 'none' }}
                className="priority-label-show">{PRIORITY_LABEL[task.priority]}</span>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {!task.done && (
                  <button
                    onClick={() => { pomo.setTaskName(task.title); onPageChange('pomodoro') }}
                    style={{
                      padding: '6px 8px', borderRadius: 'var(--r-sm)',
                      background: 'var(--accent4)', border: '1px solid rgba(124,106,245,0.2)',
                      color: 'var(--accent2)', fontSize: 13, cursor: 'pointer',
                      minHeight: 34,
                    }}
                  >🍅</button>
                )}
                <button
                  onClick={() => { deleteTask(task.id); reload() }}
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--r-sm)',
                    background: 'var(--red2)', border: '1px solid rgba(231,76,60,0.15)',
                    color: 'var(--red)', fontSize: 13, cursor: 'pointer',
                  }}
                >✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
