import { Calendar, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './NoAccountsView.module.scss';

interface NoAccountsViewProps {}

export const NoAccountsView: React.FC<NoAccountsViewProps> = () => {
  const { addAccount } = useAuthStore();

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <Calendar size={64} strokeWidth={1.5} />
      </div>

      <h2 className={styles.title}>Welcome to Calendar</h2>

      <p className={styles.description}>
        Connect your Google account to see your upcoming events and meetings right here.
      </p>

      <button className={styles.button} onClick={() => addAccount()}>
        <LogIn size={18} />
        Connect Account
      </button>
    </div>
  );
};
