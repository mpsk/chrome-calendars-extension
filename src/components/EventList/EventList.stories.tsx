import type { Meta, StoryObj } from '@storybook/react';
import type { Decorator } from '@storybook/react';
import { mockEvents, allDayEvents, timedEvents, mockAccounts } from '../../mocks/mockData';
import type { CalendarEvent } from '../../services/CalendarService';
import type { UserAccount } from '../../types/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { CalendarService } from '../../services/CalendarService';
import { mockChromeApi } from '../../mocks/mockContext';
import { EventList } from './EventList';

// Decorator to set up mocks before rendering
const withMocks = (
  accounts: UserAccount[] = mockAccounts,
  events: CalendarEvent[] = mockEvents,
  isLoading: boolean = false,
  error: string | null = null
): Decorator => {
  return (Story) => {
    // Set up mocks synchronously before rendering
    mockChromeApi();
    
    // Reset store state
    useAuthStore.setState({
      accounts,
      isLoading,
      error,
      addAccount: () => Promise.resolve(),
      removeAccount: () => Promise.resolve(),
    });

    // Mock CalendarService methods
    CalendarService.loadInitialEvents = async () => events;
    CalendarService.loadMoreEvents = async () => [];
    CalendarService.clearCache = async () => {};

    return <Story />;
  };
};

const meta: Meta<typeof EventList> = {
  title: 'Components/EventList',
  component: EventList,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof EventList>;

/**
 * No accounts connected - shows empty state
 */
export const NoAccounts: Story = {
  decorators: [withMocks([], [], false, null)],
};

/**
 * No events found - accounts exist but no events
 */
export const NoEvents: Story = {
  decorators: [withMocks(mockAccounts, [], false, null)],
};

/**
 * Loading state - initial event fetch
 */
export const LoadingState: Story = {
  decorators: [withMocks(mockAccounts, [], true, null)],
};

/**
 * Error state - failed to fetch events
 */
export const ErrorState: Story = {
  decorators: [withMocks(mockAccounts, [], false, 'Failed to load events. Please try again.')],
};

/**
 * All-day events only
 */
export const AllDayEvents: Story = {
  decorators: [withMocks(mockAccounts, allDayEvents, false, null)],
};

/**
 * Timed events only
 */
export const TimedEvents: Story = {
  decorators: [withMocks(mockAccounts, timedEvents.slice(0, 5), false, null)],
};

/**
 * Mixed events - combination of all-day and timed events
 */
export const MixedEvents: Story = {
  decorators: [withMocks(mockAccounts, mockEvents, false, null)],
};

/**
 * Multiple days with events grouped by date
 */
export const MultipleDays: Story = {
  decorators: [withMocks(mockAccounts, mockEvents, false, null)],
};

/**
 * Single event for today
 */
export const SingleEvent: Story = {
  decorators: [withMocks(mockAccounts, [mockEvents[0]], false, null)],
};
