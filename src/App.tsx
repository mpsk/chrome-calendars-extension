import { useEffect, useState } from 'react';
import styles from './App.module.scss';
import { AccountManager } from './components/AccountManager';
import { EventList } from './components/EventList';
import { useAuthStore } from './store/useAuthStore';
import { Plus, RefreshCw, Settings } from 'lucide-react';

import { CalendarService } from './services/CalendarService';

function App() {
  const { init } = useAuthStore();
  const [showAccounts, setShowAccounts] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const handleRefresh = async () => {
    await CalendarService.clearCache();
    window.location.reload();
  };

  return (
    <div className={styles.appContainer}>
      <header className={styles.appHeader}>
        <h1 className={styles.appTitle}>Button for Google Calendar</h1>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={() => window.open('https://calendar.google.com', '_blank')} title="Open Google Calendar">
            <Plus size={20} />
          </button>
          <button className={styles.headerBtn} onClick={handleRefresh} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button className={styles.headerBtn} onClick={() => setShowAccounts(!showAccounts)} title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {showAccounts && (
        <div className={styles.accountManagerOverlay}>
          <AccountManager />
        </div>
      )}

      <div className={styles.contentArea}>
        <EventList />
      </div>
    </div>
  );
}

export default App;
