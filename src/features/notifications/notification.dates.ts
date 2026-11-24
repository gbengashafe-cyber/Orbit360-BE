// Notification dates: timestamps are stored in UTC; anything shown to people is formatted in the company timezone.
export const NOTIFICATION_TIMEZONE = 'Africa/Lagos';

const displayFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: NOTIFICATION_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** DD/MM/YYYY in Africa/Lagos, e.g. 2026-12-02T10:00:00Z -> "02/12/2026". */
export const formatNotificationDate = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date');
  }
  return displayFormatter.format(date);
};

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NOTIFICATION_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Milliseconds the timezone is ahead of UTC at `instant`.
const timezoneOffsetMs = (instant: Date) => {
  const parts = Object.fromEntries(offsetFormatter.formatToParts(instant).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

/**
 * The UTC instant at which a calendar day (YYYY-MM-DD) starts in Africa/Lagos.
 * Used for inclusive "from" / exclusive "to + 1 day" date filters.
 */
export const startOfLocalDayUtc = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const naiveUtc = new Date(Date.UTC(year, month - 1, day));
  return new Date(naiveUtc.getTime() - timezoneOffsetMs(naiveUtc));
};

export const addDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};
