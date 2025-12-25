import { useState } from 'react'
import TabNavigation from './components/TabNavigation'
import VMAlertReplay from './components/VMAlertReplay'
import './App.css'

type Tab = {
  id: string
  label: string
  component: React.ReactNode
}

function App() {
  const [activeTab, setActiveTab] = useState<string>('replay')

  const tabs: Tab[] = [
    {
      id: 'replay',
      label: 'VM Alert Replay',
      component: <VMAlertReplay />
    }
    // More tabs can be added here in the future
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="app">
      <header className="app-header">
        <h1>Victoria Tools</h1>
      </header>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="app-main">
        {activeTabData?.component}
      </main>
    </div>
  )
}

export default App

