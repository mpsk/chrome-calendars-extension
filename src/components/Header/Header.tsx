import { Calendar, Plus, RefreshCw, Settings } from 'lucide-react';
import styles from './Header.module.scss';

interface HeaderProps {
  onRefresh: () => void;
  currentView: 'events' | 'settings';
  onViewChange: (view: 'events' | 'settings') => void;
}

export const Header = ({ onRefresh, currentView, onViewChange }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Google Calendar Events</h1>
      <div className={styles.actions}>
        <button
          className={styles.btn}
          onClick={() => window.open('https://calendar.google.com', '_blank')}
          title="Open Google Calendar"
        >
          <Plus size={20} />
        </button>
        <button className={styles.btn} onClick={onRefresh} title="Refresh">
          <RefreshCw size={18} />
        </button>

        <div className={styles.divider} />

        <button
          className={`${styles.btn} ${currentView === 'events' ? styles.active : ''}`}
          onClick={() => onViewChange('events')}
          title="Events"
        >
          <Calendar size={18} />
        </button>
        <button
          className={`${styles.btn} ${currentView === 'settings' ? styles.active : ''}`}
          onClick={() => onViewChange('settings')}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
