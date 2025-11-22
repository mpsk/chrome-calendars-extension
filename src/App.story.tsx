import type { Meta, StoryObj } from '@storybook/react';
import { App } from './App';
import { useMockAppContext } from './mocks/mockContext';
import { mockAccounts, mockEvents } from './mocks/mockData';

// Wrapper to setup mocks
const MockApp = ({
  isLoading = false,
  accounts = mockAccounts,
  error = null as string | null,
  events = mockEvents,
}) => {
  useMockAppContext({ isLoading, accounts, error, events });
  return <App />;
};

const meta: Meta<typeof MockApp> = {
  title: 'App/Main',
  component: MockApp,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MockApp>;

export const Default: Story = {
  args: {
    isLoading: false,
    accounts: mockAccounts,
    events: mockEvents,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    accounts: [],
    events: [],
  },
};

export const Empty: Story = {
  args: {
    isLoading: false,
    accounts: [],
    events: [],
  },
};

export const WithError: Story = {
  args: {
    isLoading: false,
    accounts: mockAccounts,
    error: 'Failed to sync accounts',
    events: mockEvents,
  },
};
