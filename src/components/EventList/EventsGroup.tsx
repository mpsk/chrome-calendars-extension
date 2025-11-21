import React from 'react';
import type { CalendarEvent } from '../../services/CalendarService';
import { Formatter } from '../../utils/Formatter';
import { EventItem, type EventItemProps } from './EventItem';
import styles from './EventsGroup.module.scss';

interface EventsGroupProps {
  events: CalendarEvent[];
  date: Date;
  onEventClick: EventItemProps['onClick'];
}

export const EventsGroup: React.FC<EventsGroupProps> = ({ events, date, onEventClick }) => {
  return (
    <div className={styles.eventsGroup}>
      <div className={styles.eventsDateHeader}>{Formatter.dateFormat(date)}</div>
      {events.map((item) => (
        <EventItem key={item.id} item={item} onClick={onEventClick} />
      ))}
    </div>
  );
};
