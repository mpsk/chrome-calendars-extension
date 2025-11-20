import { useEffect, useState } from 'react';
import styles from './App.module.scss';
import { AccountManager } from './components/AccountManager';
import { EventList } from './components/EventList';
import { Header } from './components/Header/Header';
import { useAuthStore } from './store/useAuthStore';

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
      <Header 
        onRefresh={handleRefresh} 
        onToggleSettings={() => setShowAccounts(!showAccounts)} 
      />

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
