import { getTasks } from '../store/storage'

export default function PomodoroView({ pomo }) {
  const tasks = getTasks().filter(t => !t.done)
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ - pomo.progress * circ
  const strokeColor = pomo.mode === 'focus' ? '#7c6af5' : pomo.mode === 'break' ? '#2ecc71' : '#f39c12'

  return (
    <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>

        {/* Timer */}
        <div style={{ flex:1, minWidth:280 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:24 }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:20 }}>🍅 Focus Session</div>

            <div style={{ position:'relative', width:180, height:180, margin:'0 auto 20px' }}>
              <svg viewBox="0 0 110 110" width={180} height={180} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={55} cy={55} r={r} fill="none" stroke="var(--bg4)" strokeWidth={9} />
                <circle cx={55} cy={55} r={r} fill="none" stroke={strokeColor}
                  strokeWidth={9} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  style={{ transition:'stroke-dashoffset 0.5s, stroke 0.3s' }}
                />
              </svg>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:30, fontWeight:500 }}>{pomo.display}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, textTransform:'uppercase', letterSpacing:1.5 }}>
                  {pomo.mode === 'focus' ? 'Focus' : pomo.mode === 'break' ? 'Short Break' : 'Long Break'}
                </div>
              </div>
            </div>

            <div style={{ textAlign:'center', marginBottom:16 }}>
              <select
                value={pomo.taskName}
                onChange={e => pomo.setTaskName(e.target.value)}
                style={{ width:'100%', maxWidth:300, textAlign:'center', fontSize:13, padding:'8px 12px' }}
              >
                <option value="Free Focus">Free Focus</option>
                {tasks.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', justifyContent:'center', gap:4, marginBottom:16 }}>
              {Array.from({length:4}).map((_,i)=>(
                <div key={i} style={{
                  width:10, height:10, borderRadius:'50%',
                  background: i<(pomo.session%4) ? 'var(--accent)' : 'var(--bg4)',
                  border:'1px solid var(--border2)',
                }} />
              ))}
            </div>

            <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
              <button onClick={pomo.reset} style={{ width:44, height:44, borderRadius:'50%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', fontSize:13 }}>⏮</button>
              <button onClick={pomo.toggle} style={{
                width:56, height:56, borderRadius:'50%',
                background:'var(--accent)', border:'none', color:'#fff', fontSize:18,
                boxShadow:'var(--shadow-accent)',
              }}>{pomo.running ? '⏸' : '▶'}</button>
              <button onClick={pomo.skip} style={{ width:44, height:44, borderRadius:'50%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text2)', fontSize:13 }}>⏭</button>
            </div>

            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16, flexWrap:'wrap' }}>
              <span style={{ padding:'4px 10px', borderRadius:'var(--r-full)', background:'rgba(124,106,245,0.1)', border:'1px solid rgba(124,106,245,0.2)', color:'var(--accent2)', fontSize:11 }}>🎯 Session {pomo.session+1}</span>
              <span style={{ padding:'4px 10px', borderRadius:'var(--r-full)', background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.2)', color:'var(--green)', fontSize:11 }}>⏱ {pomo.todayMins}m today</span>
            </div>
          </div>
        </div>

        {/* Session log + stats */}
        <div style={{ flex:1, minWidth:280, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:16 }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>📋 Today's Session Log</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
              {pomo.log.length === 0 && (
                <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:20 }}>No sessions yet today. Hit play! 🍅</div>
              )}
              {pomo.log.map((s,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'var(--bg3)', borderRadius:'var(--r-md)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{s.taskName}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{new Date(s.startTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--accent2)', fontFamily:'var(--font-mono)' }}>{s.durationMins}m ✓</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:16 }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>🏆 Focus Stats</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { n: Math.round(pomo.todayMins/60*10)/10 || 0, l:'hrs today' },
                { n: pomo.session, l:'sessions today' },
                { n: pomo.log.length, l:'completed' },
                { n: '🔥 Keep going!', l:'motivation', small:true },
              ].map(({n,l,small})=>(
                <div key={l} style={{ background:'var(--bg3)', borderRadius:'var(--r-md)', padding:10, textAlign:'center' }}>
                  <div style={{ fontSize: small?12:20, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--accent2)' }}>{n}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
