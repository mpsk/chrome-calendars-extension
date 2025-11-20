import { useEffect, useState } from 'react';
import { CalendarService } from '../../services/CalendarService';
import type { CalendarEvent } from '../../services/CalendarService';
import { useAuthStore } from '../../store/useAuthStore';
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
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = groupedEvents[todayKey] || [];
  const futureDates = sortedDates.filter(date => date > todayKey);

  console.log('Grouped Events:', groupedEvents);

  if (loading) return <div className={styles.loading}>Loading events...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (events.length === 0 && accounts.length > 0) return <div className={styles.emptyState}>No upcoming events found.</div>;
  if (accounts.length === 0) return <div className={styles.emptyState}>Please add an account to see events.</div>;

  const renderEvent = (event: CalendarEvent) => {
    const isAllDay = !event.start.dateTime;
    const startTime = event.start.dateTime ? format(new Date(event.start.dateTime), 'HH:mm') : '';
    const endTime = event.end.dateTime ? format(new Date(event.end.dateTime), 'HH:mm') : '';
    
    // Check if event is done (end time is in the past)
    // For all-day events, they are done if the day is passed, but here we are rendering them in their respective day group.
    // So for "Today", an all-day event is not done.
    const isDone = event.end.dateTime ? new Date(event.end.dateTime) < new Date() : false;

    return (
      <div 
        key={event.id} 
        className={`${styles.eventCard} ${isDone ? styles.isDone : ''}`}
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
  };

  return (
    <div className={styles.eventList}>
      {todayEvents.length > 0 && (
        <>
          <div className={styles.sectionHeader}>Today</div>
          <div className={styles.dateGroup}>
            {/* We don't need a date header for "Today" section as the section header serves that purpose, 
                but usually "Today" implies the date. Let's keep it simple and just list events. 
                Or maybe we want the date label too? The requirement says "show todays events and next".
                Let's render the date label for consistency if needed, but "Today" header is strong.
                Actually, let's render the date label for Today as well to be consistent with the design 
                or just list them. Let's list them directly under "Today".
            */}
             <div className={styles.dateHeader}>{format(new Date(), 'EEEE, MMMM d', { locale: uk })}</div>
            {todayEvents.map(renderEvent)}
          </div>
        </>
      )}

      {futureDates.length > 0 && (
        <>
          <div className={styles.sectionHeader}>Next</div>
          {futureDates.map(dateKey => {
            const dateEvents = groupedEvents[dateKey];
            // Parse dateKey (yyyy-MM-dd) safely
            const [y, m, d] = dateKey.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            
            const dateLabel = format(dateObj, 'EEEE, MMMM d', { locale: uk });

            return (
              <div key={dateKey} className={styles.dateGroup}>
                <div className={styles.dateHeader}>{dateLabel}</div>
                {dateEvents.map(renderEvent)}
              </div>
            );
          })}
        </>
      )}
      
      {loadingMore && <div className={styles.loadingMore}>Loading more events...</div>}
    </div>
  );
};
