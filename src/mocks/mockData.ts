import type { CalendarEvent } from '../services/CalendarService';
import type { UserAccount } from '../types/auth';

const ACCOUNTS_COLORS = {
  '1': '#039BE5',
  '2': '#3ad942ff',
  '3': '#d9be3aff',
};

// Mock user accounts
export const mockAccounts: UserAccount[] = [
  {
    id: '1',
    email: 'john.doe@gmail.com',
    name: 'John Doe',
    picture: 'https://i.pravatar.cc/150?img=12',
    token: {
      token: 'mock-token-1',
      expiry: Date.now() + 3600000,
    },
    calendars: [
      {
        id: 'primary-1',
        summary: 'John Doe',
        backgroundColor: ACCOUNTS_COLORS['1'],
        primary: true,
        visible: true,
      },
      {
        id: 'holidays-1',
        summary: 'Holidays in Ukraine',
        backgroundColor: '#0B8043',
        primary: false,
        visible: true,
      },
      {
        id: 'birthdays-1',
        summary: 'Birthdays',
        backgroundColor: '#F4511E',
        primary: false,
        visible: true,
      },
    ],
  },
  {
    id: '2',
    email: 'jane.smith@gmail.com',
    name: 'Jane Smith',
    picture: 'https://i.pravatar.cc/150?img=5',
    token: {
      token: 'mock-token-2',
      expiry: Date.now() + 3600000,
    },
    calendars: [
      {
        id: 'primary-2',
        summary: 'Jane Smith',
        backgroundColor: ACCOUNTS_COLORS['2'],
        primary: true,
        visible: true,
      },
      {
        id: 'work-2',
        summary: 'Work Projects',
        backgroundColor: '#8E24AA',
        primary: false,
        visible: true,
      },
    ],
  },
  {
    id: '3',
    email: 'alex.johnson@gmail.com',
    name: 'Alex Johnson',
    picture: 'https://i.pravatar.cc/150?img=33',
    token: {
      token: 'mock-token-3',
      expiry: Date.now() + 3600000,
    },
    calendars: [
      {
        id: 'primary-3',
        summary: 'Alex Johnson',
        backgroundColor: ACCOUNTS_COLORS['3'],
        primary: true,
        visible: true,
      },
    ],
  },
];

// Helper to create dates
const createDate = (daysFromNow: number, hour?: number, minute?: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  if (hour !== undefined) {
    date.setHours(hour, minute || 0, 0, 0);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
};

// Mock calendar events
export const mockEvents: CalendarEvent[] = [
  // Today's events
  {
    id: 'event-1',
    summary: 'Team Standup',
    start: { dateTime: createDate(0, 9, 0).toISOString() },
    end: { dateTime: createDate(0, 9, 30).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-1',
    accountId: '1',
    accountColor: '#039BE5',
    isPrimary: true,
  },
  {
    id: 'event-2',
    summary: 'Client Meeting',
    start: { dateTime: createDate(0, 14, 0).toISOString() },
    end: { dateTime: createDate(0, 15, 0).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-2',
    accountId: '1',
    accountColor: ACCOUNTS_COLORS['1'],
    isPrimary: true,
  },
  {
    id: 'event-3',
    summary: 'Planning',
    start: { dateTime: createDate(0, 18, 0).toISOString() },
    end: { dateTime: createDate(0, 19, 0).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-3',
    accountId: '2',
    accountColor: ACCOUNTS_COLORS['2'],
    isPrimary: true,
  },
  {
    id: 'event-3',
    summary: 'Birthday Party 🎉',
    start: { date: createDate(0).toISOString().split('T')[0] },
    end: { date: createDate(1).toISOString().split('T')[0] },
    htmlLink: 'https://calendar.google.com/event?eid=event-3',
    accountId: '2',
    accountColor: ACCOUNTS_COLORS['2'],
  },
  {
    id: 'event-holiday-1',
    summary: 'Independence Day 🇺🇦',
    start: { date: createDate(0).toISOString().split('T')[0] },
    end: { date: createDate(1).toISOString().split('T')[0] },
    htmlLink: 'https://calendar.google.com/event?eid=event-holiday-1',
    accountId: '1',
    accountColor: '#0B8043', // Green for holidays
  },

  // Tomorrow's events
  {
    id: 'event-4',
    summary: 'Project Review',
    start: { dateTime: createDate(1, 10, 0).toISOString() },
    end: { dateTime: createDate(1, 11, 30).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-4',
    accountId: '1',
    accountColor: ACCOUNTS_COLORS['1'],
    isPrimary: true,
  },
  {
    id: 'event-5',
    summary: 'Lunch with Sarah',
    start: { dateTime: createDate(1, 12, 30).toISOString() },
    end: { dateTime: createDate(1, 13, 30).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-5',
    accountId: '2',
    accountColor: ACCOUNTS_COLORS['2'],
  },

  // Day after tomorrow
  {
    id: 'event-6',
    summary: 'Dentist Appointment',
    start: { dateTime: createDate(2, 15, 0).toISOString() },
    end: { dateTime: createDate(2, 16, 0).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-6',
    accountId: '3',
    accountColor: ACCOUNTS_COLORS['3'],
  },
  {
    id: 'event-7',
    summary: 'Gym Session',
    start: { dateTime: createDate(2, 18, 0).toISOString() },
    end: { dateTime: createDate(2, 19, 0).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-7',
    accountId: '1',
    accountColor: ACCOUNTS_COLORS['1'],
    isPrimary: true,
  },

  // Next week - all day event
  {
    id: 'event-8',
    summary: 'Conference',
    start: { date: createDate(7).toISOString().split('T')[0] },
    end: { date: createDate(9).toISOString().split('T')[0] },
    htmlLink: 'https://calendar.google.com/event?eid=event-8',
    accountId: '1',
    accountColor: ACCOUNTS_COLORS['1'],
    isPrimary: true,
  },
  {
    id: 'event-9',
    summary: 'Team Building Event',
    start: { dateTime: createDate(8, 10, 0).toISOString() },
    end: { dateTime: createDate(8, 17, 0).toISOString() },
    htmlLink: 'https://calendar.google.com/event?eid=event-9',
    accountId: '2',
    accountColor: ACCOUNTS_COLORS['2'],
  },
];

// Filtered event sets for different scenarios
export const allDayEvents = mockEvents.filter((e) => !e.start.dateTime);
export const timedEvents = mockEvents.filter((e) => e.start.dateTime);
export const todayEvents = mockEvents.filter((e) => {
  const eventDate = new Date(e.start.dateTime || e.start.date!);
  const today = new Date();
  return eventDate.toDateString() === today.toDateString();
});
