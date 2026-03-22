import { useEffect, useRef, useState } from 'react'
import { getWeeklyStats, getMonthlyStats } from '../store/storage'
import {
  Chart,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

function BarChart({ data, labels, color = '#7c6af5', label = 'Focus Hours' }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label, data, backgroundColor: color + 'bb', borderColor: color, borderWidth: 1, borderRadius: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9898b0', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9898b0', font: { size: 11 } } }
        }
      }
    })
    return () => chartRef.current?.destroy()
  }, [data, labels, color, label])

  return <canvas ref={ref} />
}

function DonutChart({ data, labels, colors }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: false } }
      }
    })
    return () => chartRef.current?.destroy()
  }, [data, labels, colors])

  return <canvas ref={ref} />
}

export default function ReportsView() {
  const [weekly, setWeekly]   = useState([])
  const [monthly, setMonthly] = useState([])
  const [view, setView]       = useState('week')

  useEffect(() => {
    getWeeklyStats().then(setWeekly)
    getMonthlyStats().then(setMonthly)
  }, [])

  const weekLabels  = weekly.map(d => new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }))
  const weekData    = weekly.map(d => d.hours)
  const totalHours  = weekData.reduce((s, h) => s + h, 0).toFixed(1)
  const totalSessions = weekly.reduce((s, d) => s + d.sessions, 0)

  const monthLabels = monthly.map(d => d.day)
  const monthData   = monthly.map(d => d.hours)
  const monthTotal  = monthData.reduce((s, h) => s + h, 0).toFixed(1)

  const heatMax = Math.max(...monthData, 1)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

        {/* Weekly bar chart */}
        <div style={{ flex: 2, minWidth: 340 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>📈 Focus Hours</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['week', 'month'].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: '4px 10px', borderRadius: 'var(--r-sm)', fontSize: 11, cursor: 'pointer',
                    background: view === v ? 'var(--accent)' : 'var(--bg3)',
                    border: `1px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
                    color: view === v ? '#fff' : 'var(--text2)',
                  }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent2)' }}>{view === 'week' ? totalHours : monthTotal}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Total hours</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent2)' }}>{totalSessions}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Sessions</div>
              </div>
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              {view === 'week'
                ? <BarChart data={weekData} labels={weekLabels} color="#7c6af5" label="Focus Hours" />
                : <BarChart data={monthData} labels={monthLabels} color="#3498db" label="Focus Hours" />
              }
            </div>
          </div>
        </div>

        {/* Donut - task distribution */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>🥧 Focus by Type</div>
            <div style={{ position: 'relative', height: 160 }}>
              <DonutChart
                data={[35, 30, 25, 10]}
                labels={['Lectures', 'Study', 'Project', 'Breaks']}
                colors={['#3498db', '#a89cf8', '#f39c12', '#2ecc71']}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {[['Lectures','#3498db','35%'],['Study','#a89cf8','30%'],['Project','#f39c12','25%'],['Breaks','#2ecc71','10%']].map(([l,c,p])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:c, flexShrink:0 }} />
                  <span style={{ flex:1, color:'var(--text2)' }}>{l}</span>
                  <span style={{ color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:11 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly heatmap */}
        <div style={{ flex: 2, minWidth: 340 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>🗓️ Monthly Heatmap</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['S','M','T','W','T','F','S'].map((d,i)=>(
                <div key={i} style={{ fontSize:9, color:'var(--text3)', textAlign:'center', paddingBottom:4 }}>{d}</div>
              ))}
              {monthly.map((d, i) => {
                const alpha = heatMax > 0 ? 0.1 + (d.hours / heatMax) * 0.85 : 0.1
                return (
                  <div
                    key={i}
                    title={`${d.date}: ${d.hours}h`}
                    style={{
                      aspectRatio: 1,
                      borderRadius: 3,
                      background: `rgba(124,106,245,${alpha.toFixed(2)})`,
                      cursor: 'pointer',
                      transition: 'outline 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.outline = '1px solid var(--accent2)'}
                    onMouseLeave={e => e.currentTarget.style.outline = 'none'}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 12, fontSize: 10, color: 'var(--text3)' }}>
              <span>Less</span>
              {[0.1,0.3,0.5,0.7,0.9].map(a=>(
                <div key={a} style={{ width:12, height:12, borderRadius:2, background:`rgba(124,106,245,${a})` }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>🏅 Achievements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon:'🔥', title:'7 Day Streak', sub:'Consistency champ', unlocked:true },
                { icon:'⚡', title:'Focus Master', sub:'50+ hours/month', unlocked:true },
                { icon:'🎯', title:'10 Day Streak', sub:'3 more days to go', unlocked:false },
                { icon:'🏆', title:'Century', sub:'100 sessions', unlocked:false },
              ].map(a=>(
                <div key={a.title} style={{
                  padding:10, background:'var(--bg3)', borderRadius:'var(--r-md)',
                  display:'flex', alignItems:'center', gap:10,
                  opacity: a.unlocked ? 1 : 0.4,
                }}>
                  <div style={{ fontSize:20 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{a.title}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{a.sub}</div>
                  </div>
                  {a.unlocked && <div style={{ marginLeft:'auto', fontSize:10, color:'var(--green)' }}>✓</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
