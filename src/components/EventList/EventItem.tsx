import React from 'react';
import classNames from 'classnames';
import type { CalendarEvent } from '../../types/auth';
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
    <div
      key={item.id}
      className={classNames(styles.eventCard, { [styles.isDone]: isDone, [styles.allDay]: isAllDay })}
      style={{ border: item.accountColor ? `1px solid ${item.accountColor}` : undefined }}
      onClick={() => onClick(item)}
    >
      <div
        className={classNames(styles.timeBlock, { [styles.allDay]: isAllDay, [styles.hasTime]: !isAllDay })}
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
