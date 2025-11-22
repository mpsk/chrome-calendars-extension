import { format } from 'date-fns';

const LOCALE = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

const DEFAULT_DATE_SETTINGS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
  second: undefined,
  hour12: false,
};

const DATE_FORMAT = {
  YYYY_MM_DD: 'yyyy-MM-dd',
  'HH:mm': 'HH:mm',
  'EEEE, MMMM d': 'EEEE, MMMM d',
};

export class Formatter {
  static DATE_FORMAT = DATE_FORMAT;

  static date = new Intl.DateTimeFormat(LOCALE, {
    ...DEFAULT_DATE_SETTINGS,
  });

  static dateFormat = (date: Date, pattern: ValueOf<typeof DATE_FORMAT> = DATE_FORMAT['EEEE, MMMM d']) => {
    return format(date, pattern);
  };

  // Helper to parse date string safely to local midnight
  static parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) return new Date(dateStr); // ISO string with time
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d); // Local midnight
  };

  date: Intl.DateTimeFormat;

  constructor({
    locale = LOCALE,
    dateOptions,
  }: { locale?: string; dateOptions?: Intl.DateTimeFormatOptions; numberOptions?: Intl.NumberFormatOptions } = {}) {
    this.date = new Intl.DateTimeFormat(locale, { ...DEFAULT_DATE_SETTINGS });

    try {
      this.date = new Intl.DateTimeFormat(locale, {
        ...DEFAULT_DATE_SETTINGS,
        ...dateOptions,
      });
    } catch (e) {
      console.error(e);
    }
  }
}
