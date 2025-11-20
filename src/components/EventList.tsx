import { useEffect, useState } from 'react';
import { CalendarService } from '../services/CalendarService';
import type { CalendarEvent } from '../services/CalendarService';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale'; // Ukrainian locale for the screenshot match
import styles from './EventList.module.scss';

export const EventList = () => {
  const { accounts } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRangeEnd, setCurrentRangeEnd] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Initial range: 2 weeks
    return d;
  });

  // Initial load
  useEffect(() => {
    const fetchInitial = async () => {
      if (accounts.length === 0) {
        setEvents([]);
        return;
      }

      setLoading(true);
      try {
        const initialEvents = await CalendarService.loadInitialEvents(accounts);
        setEvents(initialEvents);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load events';
        setError(errorMessage);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [accounts]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = async () => {
      if (loading || loadingMore || accounts.length === 0) return;

      const scrolledToBottom = 
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (scrolledToBottom) {
        setLoadingMore(true);
        try {
          const newEvents = await CalendarService.loadMoreEvents(accounts, currentRangeEnd);
          
          if (newEvents.length > 0) {
            setEvents(prev => {
              // Filter out duplicates just in case
              const existingIds = new Set(prev.map(e => e.id));
              const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
              return [...prev, ...uniqueNewEvents];
            });
            
            // Update range end
            setCurrentRangeEnd(prev => {
              const next = new Date(prev);
              next.setDate(next.getDate() + 14);
              return next;
            });
          }
        } catch (err) {
          console.error('Failed to load more events:', err);
        } finally {
          setLoadingMore(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [accounts, currentRangeEnd, loading, loadingMore]);

  const openEvent = (event: CalendarEvent) => {
    const account = accounts.find(a => a.id === event.accountId);
    let url = event.htmlLink;
    
    if (account?.email) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}authuser=${encodeURIComponent(account.email)}`;
    }
    
    window.open(url, '_blank');
  };

  // Helper to parse date string safely to local midnight
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) return new Date(dateStr); // ISO string with time
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d); // Local midnight
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (!dateStr) return groups;
    
    // Use the safe parser to get the date object
    const dateObj = parseDate(dateStr);
    const dateKey = format(dateObj, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  console.log('Grouped Events:', groupedEvents);

  if (loading) return <div className={styles.loading}>Loading events...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (events.length === 0 && accounts.length > 0) return <div className={styles.emptyState}>No upcoming events found.</div>;
  if (accounts.length === 0) return <div className={styles.emptyState}>Please add an account to see events.</div>;

  return (
    <div className={styles.eventList}>
      {sortedDates.map(dateKey => {
        const dateEvents = groupedEvents[dateKey];
        // Parse dateKey (yyyy-MM-dd) safely
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
                  onClick={() => openEvent(event)}
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
      {loadingMore && <div className={styles.loadingMore}>Loading more events...</div>}
    </div>
  );
};
