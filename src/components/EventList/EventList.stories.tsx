import type { Meta, StoryObj } from '@storybook/react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import styles from './EventList.module.scss';
import { mockEvents, allDayEvents, timedEvents } from '../../mocks/mockData';
import type { CalendarEvent } from '../../services/CalendarService';

// Pure presentational component for Storybook
const EventListPresentation = ({
  events,
  loading,
  error,
  emptyMessage,
}: {
  events: CalendarEvent[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}) => {
  const openEvent = (link: string) => {
    console.log('[Mock] Opening event:', link);
  };

  // Helper to parse date string safely to local midnight
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) return new Date(dateStr); // ISO string with time
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d); // Local midnight
  };

  if (loading) return <div className={styles.loading}>Loading events...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (events.length === 0) return <div className={styles.emptyState}>{emptyMessage || 'No upcoming events found.'}</div>;

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (!dateStr) return groups;
    
    const dateObj = parseDate(dateStr);
    const dateKey = format(dateObj, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className={styles.eventList}>
      {sortedDates.map(dateKey => {
        const dateEvents = groupedEvents[dateKey];
        const [y, m, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        
        const dateLabel = format(dateObj, 'EEEE, MMMM d', { locale: uk });

        return (
          <div key={dateKey} className={styles.dateGroup}>
            <div className={styles.dateHeader}>{dateLabel}</div>
            {dateEvents.map(event => {
              const isAllDay = !event.start.dateTime;
              const startTime = event.start.dateTime ? format(new Date(event.start.dateTime), 'HH:mm') : '';
              const endTime = event.end.dateTime ? format(new Date(event.end.dateTime), 'HH:mm') : '';

              return (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => openEvent(event.htmlLink)}
                >
                  <div 
                    className={`${styles.timeBlock} ${isAllDay ? styles.allDay : styles.hasTime}`}
                    style={{ backgroundColor: event.accountColor || undefined }}
                  >
                    {!isAllDay && (
                      <>
                        <span>{startTime}</span>
                        <span>{endTime}</span>
                      </>
                    )}
                  </div>
                  <div className={styles.eventInfo}>
                    <span className={styles.eventTitle}>{event.summary}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const meta: Meta<typeof EventListPresentation> = {
  title: 'Components/EventList',
  component: EventListPresentation,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof EventListPresentation>;

/**
 * No accounts connected - shows empty state
 */
export const NoAccounts: Story = {
  args: {
    events: [],
    emptyMessage: 'Please add an account to see events.',
  },
};

/**
 * No events found - accounts exist but no events
 */
export const NoEvents: Story = {
  args: {
    events: [],
    emptyMessage: 'No upcoming events found.',
  },
};

/**
 * Loading state - initial event fetch
 */
export const LoadingState: Story = {
  args: {
    events: [],
    loading: true,
  },
};

/**
 * Error state - failed to fetch events
 */
export const ErrorState: Story = {
  args: {
    events: [],
    error: 'Failed to load events. Please try again.',
  },
};

/**
 * All-day events only
 */
export const AllDayEvents: Story = {
  args: {
    events: allDayEvents,
  },
};

/**
 * Timed events only
 */
export const TimedEvents: Story = {
  args: {
    events: timedEvents.slice(0, 5),
  },
};

/**
 * Mixed events - combination of all-day and timed events
 */
export const MixedEvents: Story = {
  args: {
    events: mockEvents,
  },
};

/**
 * Multiple days with events grouped by date
 */
export const MultipleDays: Story = {
  args: {
    events: mockEvents,
  },
};

/**
 * Single event for today
 */
export const SingleEvent: Story = {
  args: {
    events: [mockEvents[0]],
  },
};
