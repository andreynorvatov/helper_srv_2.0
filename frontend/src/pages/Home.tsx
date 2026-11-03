import type { TabId } from '../types'
import BalanceTab from '../components/tabs/BalanceTab'
import ProfileTab from '../components/tabs/ProfileTab'
import ApiDocsTab from '../components/tabs/ApiDocsTab'

interface HomeProps {
  activeTab: TabId
}

export default function Home({ activeTab }: HomeProps) {
  switch (activeTab) {
    case 'balance':
      return <BalanceTab />
    case 'profile':
      return <ProfileTab />
    case 'docs':
      return <ApiDocsTab />
  }
}
