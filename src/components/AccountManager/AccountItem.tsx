import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserAccount } from '../../types/auth';
import styles from './AccountItem.module.scss';

interface AccountItemProps {
  account: UserAccount;
}

export const AccountItem: React.FC<AccountItemProps> = ({ account }) => {
  const { removeAccount, toggleCalendarVisibility } = useAuthStore();

  return (
    <div className={styles.accountItem}>
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
          {account.calendars
            .filter((calendar) => !calendar.primary)
            .map((calendar) => (
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
  );
};
