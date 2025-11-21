import { useEffect, useState } from 'react';
import styles from './App.module.scss';
import { AccountManager } from './components/AccountManager';
import { EventList } from './components/EventList';
import { Header } from './components/Header/Header';
import { useAuthStore } from './store/useAuthStore';

import { CalendarService } from './services/CalendarService';

export function App() {
  const { init, refreshAccounts } = useAuthStore();
  const [currentView, setCurrentView] = useState<'events' | 'settings'>('events');

  useEffect(() => {
    init();
  }, [init]);

  const handleRefresh = async () => {
    await refreshAccounts();

    window.location.reload();
  };

  return (
    <div className={styles.appContainer}>
      <Header
        onRefresh={handleRefresh}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className={styles.contentArea}>
        {currentView === 'events' ? (
          <EventList />
        ) : (
          <AccountManager />
        )}
      </div>
    </div>
  );
}
