// WeekView.jsx
import { getSchedule } from '../store/storage'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = Array.from({length:13},(_,i)=>i+7) // 7am–7pm

export default function WeekView() {
  const schedule = getSchedule()
  const today = new Date()
  const weekStart = new Date(today); weekStart.setDate(today.getDate()-today.getDay())

  const getEventsForDayHour = (dayIdx, hour) =>
    schedule.filter(s => {
      const [h] = s.time.split(':').map(Number)
      return h === hour
    })

  return (
    <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ padding:'10px 6px', borderRight:'1px solid var(--border)' }} />
          {DAYS.map((d,i) => {
            const dd = new Date(weekStart); dd.setDate(weekStart.getDate()+i)
            const isToday = dd.toDateString()===today.toDateString()
            return (
              <div key={d} style={{ padding:'10px 6px', textAlign:'center', borderRight:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{d}</div>
                <div style={{
                  fontSize:18, fontWeight:700, fontFamily:'var(--font-mono)',
                  color: isToday ? 'var(--accent)' : 'var(--text)',
                  marginTop:2,
                }}>{dd.getDate()}</div>
              </div>
            )
          })}
        </div>
        {/* Time rows */}
        {HOURS.map(h => (
          <div key={h} style={{ display:'grid', gridTemplateColumns:'48px repeat(7,1fr)', minHeight:52 }}>
            <div style={{
              fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)',
              padding:'4px 4px 0', borderRight:'1px solid var(--border)',
              borderBottom:'1px solid rgba(255,255,255,0.03)',
            }}>{h < 12 ? h+'am' : h===12 ? '12pm' : (h-12)+'pm'}</div>
            {DAYS.map((_,di) => {
              const events = di===today.getDay() ? getEventsForDayHour(di,h) : []
              return (
                <div key={di} style={{
                  borderRight:'1px solid var(--border)',
                  borderBottom:'1px solid rgba(255,255,255,0.03)',
                  padding:2, minHeight:52,
                }}>
                  {events.map(e => (
                    <div key={e.id} style={{
                      background:`${e.color}22`, borderLeft:`2px solid ${e.color}`,
                      borderRadius:4, padding:'2px 5px',
                      fontSize:10, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                    }}>{e.title}</div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
