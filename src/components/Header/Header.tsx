import styles from './Header.module.scss';
import { Plus, RefreshCw, Settings } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onToggleSettings: () => void;
}

export const Header = ({ onRefresh, onToggleSettings }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Button for Google Calendar</h1>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={() => window.open('https://calendar.google.com', '_blank')} title="Open Google Calendar">
          <Plus size={20} />
        </button>
        <button className={styles.btn} onClick={onRefresh} title="Refresh">
          <RefreshCw size={18} />
        </button>
        <button className={styles.btn} onClick={onToggleSettings} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
