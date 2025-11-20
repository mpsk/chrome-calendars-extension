import type { Meta, StoryObj } from '@storybook/react';
import { LogOut, Plus } from 'lucide-react';
import styles from './AccountManager.module.scss';
import { mockAccounts } from '../../mocks/mockData';
import type { UserAccount } from '../../types/auth';

// Pure presentational component for Storybook
const AccountManagerPresentation = ({
  accounts,
  isLoading,
  error,
  onAddAccount,
  onRemoveAccount,
}: {
  accounts: UserAccount[];
  isLoading: boolean;
  error: string | null;
  onAddAccount: () => void;
  onRemoveAccount: (id: string) => void;
}) => {
  return (
    <div className={styles.accountManager}>
      <div className={styles.accountHeader}>
        <h2>Accounts</h2>
        <button 
          onClick={onAddAccount} 
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
              onClick={() => onRemoveAccount(account.id)}
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

const meta: Meta<typeof AccountManagerPresentation> = {
  title: 'Components/AccountManager',
  component: AccountManagerPresentation,
  parameters: {
    layout: 'padded',
  },
  args: {
    onAddAccount: () => console.log('[Mock] Add account clicked'),
    onRemoveAccount: (id: string) => console.log('[Mock] Remove account clicked:', id),
  },
};

export default meta;
type Story = StoryObj<typeof AccountManagerPresentation>;

/**
 * Empty state - no accounts connected
 */
export const EmptyState: Story = {
  args: {
    accounts: [],
    isLoading: false,
    error: null,
  },
};

/**
 * Single account connected
 */
export const SingleAccount: Story = {
  args: {
    accounts: [mockAccounts[0]],
    isLoading: false,
    error: null,
  },
};

/**
 * Multiple accounts connected
 */
export const MultipleAccounts: Story = {
  args: {
    accounts: mockAccounts,
    isLoading: false,
    error: null,
  },
};

/**
 * Loading state when adding an account
 */
export const LoadingState: Story = {
  args: {
    accounts: [mockAccounts[0]],
    isLoading: true,
    error: null,
  },
};

/**
 * Error state when account operation fails
 */
export const ErrorState: Story = {
  args: {
    accounts: [mockAccounts[0]],
    isLoading: false,
    error: 'Failed to add account. Please try again.',
  },
};
