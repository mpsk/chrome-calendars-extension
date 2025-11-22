import { useAuthStore } from '../../store/useAuthStore';
import { AccountItem } from './AccountItem';
import styles from './AccountManager.module.scss';
import { AddAccountBtn } from './AddAccountBtn';

export const AccountManager = () => {
  const { accounts, isLoading, error } = useAuthStore();

  return (
    <div className={styles.accountManager}>
      <div className={styles.accountHeader}>
        <h2>Accounts</h2>
        <AddAccountBtn className={styles.btnIcon} />
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.accountList}>
        {accounts.map((account) => (
          <AccountItem key={account.id} account={account} />
        ))}
        {accounts.length === 0 && !isLoading && (
          <div className={styles.emptyState}>No accounts connected. Click + to add one.</div>
        )}
      </div>
    </div>
  );
};
