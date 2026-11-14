/**
 * Card date "Sat, 11 Jul" -> regex that matches the details page date "Saturday, 11 July".
 */
export function longDatePatternFromCardDate(cardDate: string): RegExp {
  const match = /^([A-Za-z]{3}), (\d{1,2}) ([A-Za-z]{3})$/.exec(cardDate.trim());
  if (!match) throw new Error(`Unexpected card date format: "${cardDate}"`);
  const [, weekday, day, month] = match;
  return new RegExp(`^${weekday}[a-z]*, ${day} ${month}[a-z]*$`);
}

/** "10:00 pm" -> { hours: 22, minutes: 0 } */
export function parseTime12h(text: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{2}) (am|pm)$/i.exec(text.trim());
  if (!match) throw new Error(`Unexpected time format: "${text}"`);
  const [, h, m, period] = match;
  const hours = (Number(h) % 12) + (period.toLowerCase() === 'pm' ? 12 : 0);
  return { hours, minutes: Number(m) };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Local date & time `daysAhead` days from now (at 12:00) in the format of the admin form: "YYYY-MM-DDTHH:mm". */
export function futureDateTime(daysAhead = 120): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00`;
}

/** ISO 8601 date-time `daysAhead` days from now (e.g. "2026-06-15T12:00:00.000Z"), the format the API expects. */
export function futureIsoDateTime(daysAhead = 120): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

/** Form date & time "2027-03-10T12:00" -> the date as shown in the Manage Events table: "10 Mar 2027". */
export function tableDate(dateTime: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(dateTime);
  if (!match) throw new Error(`Unexpected date & time format: "${dateTime}"`);
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}
