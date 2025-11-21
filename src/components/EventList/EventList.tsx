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
        console.log('=== initialEvents', initialEvents);
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && accounts.length > 0) {
          loadMore();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the sentinel is visible
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, accounts, currentRangeEnd]);

  const loadMore = async () => {
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
  };

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

      {/* Sentinel element for IntersectionObserver */}
      <div id="scroll-sentinel" style={{ height: '20px', margin: '10px 0' }}>
        {loadingMore && <div className={styles.loadingMore}>Loading more events...</div>}
      </div>
    </div>
  );
};
