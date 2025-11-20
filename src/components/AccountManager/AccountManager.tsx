import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Plus } from 'lucide-react';
import styles from './AccountManager.module.scss';

export const AccountManager = () => {
  const { accounts, addAccount, removeAccount, toggleCalendarVisibility, isLoading, error } = useAuthStore();

  console.log({ accounts });



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
            <div className={styles.accountMain}>
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
            
            {account.calendars && account.calendars.length > 0 && (
              <div className={styles.calendarList}>
                {account.calendars.filter(calendar => !calendar.primary).map(calendar => (
                  <label 
                    key={calendar.id} 
                    className={styles.calendarItem}
                    style={{ '--calendar-color': calendar.backgroundColor } as React.CSSProperties}
                  >
                    <input 
                      type="checkbox" 
                      checked={calendar.visible}
                      onChange={() => toggleCalendarVisibility(account.id, calendar.id)}
                    />
                    <span>{calendar.summary}</span>
                  </label>
                ))}
              </div>
            )}
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
