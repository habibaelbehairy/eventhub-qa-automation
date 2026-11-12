/**
 * Card date "Sat, 11 Jul" -> regex that matches the details page date "Saturday, 11 July".
 */
export function longDatePatternFromCardDate(cardDate: string): RegExp {
  const match = cardDate.trim().match(/^([A-Za-z]{3}), (\d{1,2}) ([A-Za-z]{3})$/);
  if (!match) throw new Error(`Unexpected card date format: "${cardDate}"`);
  const [, weekday, day, month] = match;
  return new RegExp(`^${weekday}[a-z]*, ${day} ${month}[a-z]*$`);
}

/** "10:00 pm" -> { hours: 22, minutes: 0 } */
export function parseTime12h(text: string): { hours: number; minutes: number } {
  const match = text.trim().match(/^(\d{1,2}):(\d{2}) (am|pm)$/i);
  if (!match) throw new Error(`Unexpected time format: "${text}"`);
  const [, h, m, period] = match;
  const hours = (Number(h) % 12) + (period.toLowerCase() === 'pm' ? 12 : 0);
  return { hours, minutes: Number(m) };
}
