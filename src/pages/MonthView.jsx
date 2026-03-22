import { useState } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MonthView() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const busyDays = new Set([1,3,5,8,10,12,15,17,19,22,24,26,29,31].filter(d=>d<=daysInMonth))

  const prev = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const next = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  return (
    <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:600 }}>{MONTHS[month]} {year}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={prev} style={{ padding:'6px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', color:'var(--text)', cursor:'pointer' }}>←</button>
            <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }} style={{ padding:'6px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', color:'var(--text2)', cursor:'pointer', fontSize:12 }}>Today</button>
            <button onClick={next} style={{ padding:'6px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', color:'var(--text)', cursor:'pointer' }}>→</button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, background:'var(--border)' }}>
          {['S','M','T','W','T','F','S'].map((d,i)=>(
            <div key={i} style={{ background:'var(--bg3)', padding:'8px 0', textAlign:'center', fontSize:11, color:'var(--text3)', fontWeight:600 }}>{d}</div>
          ))}
          {Array.from({length:firstDay}).map((_,i)=>(
            <div key={'e'+i} style={{ background:'var(--bg2)', minHeight:70 }} />
          ))}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
            const isToday = d===today.getDate() && month===today.getMonth() && year===today.getFullYear()
            const hasTasks = busyDays.has(d)
            return (
              <div key={d} style={{
                background:'var(--bg2)', minHeight:70, padding:6,
                cursor:'pointer', transition:'background 0.1s',
                outline: isToday ? '2px solid var(--accent)' : 'none',
                outlineOffset: isToday ? -2 : 0,
              }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                onMouseLeave={e=>e.currentTarget.style.background='var(--bg2)'}
              >
                <div style={{ fontSize:13, fontWeight: isToday?600:400, color: isToday?'var(--accent)':'var(--text)' }}>{d}</div>
                {hasTasks && (
                  <div style={{ marginTop:4 }}>
                    <div style={{ height:3, borderRadius:2, background:'var(--accent)', opacity:0.6 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
