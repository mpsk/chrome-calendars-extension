import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Plus } from 'lucide-react';
import styles from './AccountManager.module.scss';

export const AccountManager = () => {
  const { accounts, addAccount, removeAccount, isLoading, error } = useAuthStore();

  return (
    <div className={styles.accountManager}>
      <div className={styles.accountHeader}>
        <h2>Accounts</h2>
        <button 
          onClick={() => addAccount()} 
          disabled={isLoading}
          className={styles.btnIcon}
          title="Add Account"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.accountList}>
        {accounts.map(account => (
          <div key={account.id} className={styles.accountItem}>
            <div className={styles.accountInfo}>
              <img src={account.picture} alt={account.name} className={styles.accountAvatar} />
              <div className={styles.accountDetails}>
                <span className={styles.accountName}>{account.name}</span>
                <span className={styles.accountEmail}>{account.email}</span>
              </div>
            </div>
            <button 
              onClick={() => removeAccount(account.id)}
              className={`${styles.btnIcon} ${styles.danger}`}
              title="Remove Account"
            >
              <LogOut size={16} />
            </button>
          </div>
        ))}
        
        {accounts.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            No accounts connected. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
};
