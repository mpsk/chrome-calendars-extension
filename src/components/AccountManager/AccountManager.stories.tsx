import type { Meta, StoryObj } from '@storybook/react';
import { mockAccounts } from '../../mocks/mockData';
import type { UserAccount } from '../../types/auth';
import { useMockAppContext, type MockAppContextProps } from '../../mocks/mockContext';
import { AccountManager } from './AccountManager';

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
  onAddAccount: MockAppContextProps['addAccount']
  onRemoveAccount: MockAppContextProps['removeAccount'];
}) => {
  useMockAppContext({ accounts, isLoading, error, addAccount: onAddAccount, removeAccount: onRemoveAccount });
  return <AccountManager />
};

const meta: Meta<typeof AccountManagerPresentation> = {
  title: 'Components/AccountManager',
  component: AccountManagerPresentation,
  parameters: {
    layout: 'padded',
  },
  args: {
    onAddAccount: () => {
      console.log('[Mock] Add account clicked');
      return Promise.resolve();
    },
    onRemoveAccount: (id: string) => {
      console.log('[Mock] Remove account clicked:', id);
      return Promise.resolve();
    },
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
