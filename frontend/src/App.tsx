import { useState } from 'react'
import type { TabId } from './types'
import Layout from './components/Layout'
import Home from './pages/Home'
import { ThemeProvider } from './hooks/useTheme'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('balance')

  return (
    <ThemeProvider>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <Home activeTab={activeTab} />
      </Layout>
    </ThemeProvider>
  )
}
