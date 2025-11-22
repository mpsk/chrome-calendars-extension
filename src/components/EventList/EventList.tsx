import { useEffect, useState } from 'react';
import { CalendarService } from '../../services/CalendarService';
import { StorageService } from '../../services/StorageService';
import { useAuthStore } from '../../store/useAuthStore';
import type { CalendarEvent } from '../../types/auth';
import { Formatter } from '../../utils/Formatter';
import styles from './EventList.module.scss';
import { EventsGroup } from './EventsGroup';

const ID_SCROLL_THRESHOLD = 'scroll-sentinel';

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
        const cachedEvents = await StorageService.getInitialEvents();
        console.log('=== cachedEvents', cachedEvents);
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
          return;
        }
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
      { threshold: 0.1 }, // Trigger when 10% of the sentinel is visible
    );

    const sentinel = document.getElementById(ID_SCROLL_THRESHOLD);
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
        setEvents((prev) => {
          // Filter out duplicates just in case
          const existingIds = new Set(prev.map((e) => e.id));
          const uniqueNewEvents = newEvents.filter((e) => !existingIds.has(e.id));
          return [...prev, ...uniqueNewEvents];
        });

        // Update range end
        setCurrentRangeEnd((prev) => {
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
    const account = accounts.find((a) => a.id === event.accountId);
    let url = event.htmlLink;

    if (account?.email) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}authuser=${encodeURIComponent(account.email)}`;
    }

    window.open(url, '_blank');
  };

  // Group events by date
  const groupedEvents = events.reduce(
    (groups, event) => {
      const dateStr = event.start.dateTime || event.start.date;
      if (!dateStr) return groups;

      // Use the safe parser to get the date object
      const dateObj = Formatter.parseDate(dateStr);
      const dateKey = Formatter.dateFormat(dateObj, Formatter.DATE_FORMAT.YYYY_MM_DD);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
      return groups;
    },
    {} as Record<string, CalendarEvent[]>,
  );

  const sortedDates = Object.keys(groupedEvents).sort();
  const todayKey = Formatter.dateFormat(new Date(), Formatter.DATE_FORMAT.YYYY_MM_DD);
  const todayEvents = groupedEvents[todayKey] || [];
  const futureDates = sortedDates.filter((date) => date > todayKey);

  if (loading) return <div className={styles.loading}>Loading events...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (events.length === 0 && accounts.length > 0)
    return <div className={styles.emptyState}>No upcoming events found.</div>;
  if (accounts.length === 0) return <div className={styles.emptyState}>Please add an account to see events.</div>;

  return (
    <div className={styles.eventList}>
      {todayEvents.length > 0 && (
        <>
          <div className={styles.sectionHeader}>Today</div>
          <EventsGroup date={new Date()} events={todayEvents} onEventClick={openEvent} />
        </>
      )}

      {futureDates.length > 0 && (
        <>
          <div className={styles.sectionHeader}>Next</div>
          {futureDates.map((dateKey) => {
            const dateEvents = groupedEvents[dateKey];
            // Parse dateKey (yyyy-MM-dd) safely
            const [y, m, d] = dateKey.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);

            return <EventsGroup key={dateKey} date={dateObj} events={dateEvents} onEventClick={openEvent} />;
          })}
        </>
      )}

      {/* Sentinel element for IntersectionObserver */}
      <div id={ID_SCROLL_THRESHOLD} style={{ height: '20px', margin: '10px 0' }}>
        {loadingMore && <div className={styles.loadingMore}>Loading more events...</div>}
      </div>
    </div>
  );
};
