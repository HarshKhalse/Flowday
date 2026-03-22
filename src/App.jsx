import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import TopBar from './components/TopBar'
import TodayView from './pages/TodayView'
import WeekView from './pages/WeekView'
import MonthView from './pages/MonthView'
import PomodoroView from './pages/PomodoroView'
import ReportsView from './pages/ReportsView'
import TasksView from './pages/TasksView'
import UploadView from './pages/UploadView'
import SettingsView from './pages/SettingsView'
import AIChat from './components/AIChat'
import { seedDemoSessions } from './store/storage'
import { usePomodoro } from './hooks/usePomodoro'

export default function App() {
  const [page, setPage] = useState('today')
  const [aiOpen, setAiOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const pomo = usePomodoro()

  useEffect(() => { seedDemoSessions() }, [])

  const onScheduleChange = () => setRefreshKey(k => k + 1)

  const pages = {
    today:    <TodayView key={refreshKey} pomo={pomo} onPageChange={setPage} />,
    week:     <WeekView key={refreshKey} />,
    month:    <MonthView />,
    pomodoro: <PomodoroView pomo={pomo} />,
    reports:  <ReportsView />,
    tasks:    <TasksView key={refreshKey} pomo={pomo} onPageChange={setPage} />,
    upload:   <UploadView onImport={onScheduleChange} />,
    settings: <SettingsView />,
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <Sidebar activePage={page} onNavigate={setPage} pomo={pomo} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar
          page={page}
          onNavigate={setPage}
          onAIToggle={() => setAiOpen(o => !o)}
        />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {pages[page]}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav activePage={page} onNavigate={setPage} pomo={pomo} />

      {/* Mobile AI FAB */}
      <button
        className="ai-fab-mobile"
        onClick={() => setAiOpen(o => !o)}
        aria-label="Open AI Assistant"
      >🤖</button>

      {/* AI Chat panel */}
      <AIChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onScheduleChange={onScheduleChange}
      />
    </div>
  )
}
