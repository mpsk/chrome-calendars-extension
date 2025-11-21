import React from 'react';
import type { CalendarEvent } from '../../services/CalendarService';
import { Formatter } from '../../utils/Formatter';
import styles from './EventItem.module.scss';

export interface EventItemProps {
  item: CalendarEvent;
  onClick(item: CalendarEvent): void;
}

export const EventItem: React.FC<EventItemProps> = ({ item, onClick }) => {
  const isAllDay = !item.start.dateTime;
  const startTime = item.start.dateTime
    ? Formatter.dateFormat(new Date(item.start.dateTime), Formatter.DATE_FORMAT['HH:mm'])
    : '';
  const endTime = item.end.dateTime
    ? Formatter.dateFormat(new Date(item.end.dateTime), Formatter.DATE_FORMAT['HH:mm'])
    : '';

  // Check if event is done (end time is in the past)
  // For all-day events, they are done if the day is passed, but here we are rendering them in their respective day group.
  // So for "Today", an all-day event is not done.
  const isDone = item.end.dateTime ? new Date(item.end.dateTime) < new Date() : false;

  return (
    <div key={item.id} className={`${styles.eventCard} ${isDone ? styles.isDone : ''}`} onClick={() => onClick(item)}>
      <div
        className={`${styles.timeBlock} ${isAllDay ? styles.allDay : styles.hasTime}`}
        style={{ backgroundColor: item.accountColor || undefined }}
      >
        {!isAllDay && (
          <>
            <span>{startTime}</span>
            <span>{endTime}</span>
          </>
        )}
      </div>
      <div className={styles.eventInfo}>
        <span className={styles.eventTitle}>{item.summary}</span>
      </div>
    </div>
  );
};
