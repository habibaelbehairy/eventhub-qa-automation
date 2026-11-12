/** "$1,234.50" -> 1234.5 ; "$500" -> 500 */
export function parseMoney(text: string): number {
  const value = Number(text.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(value)) throw new Error(`Cannot parse money from "${text}"`);
  return value;
}

/** First integer in a string: "🎫 2 tickets" -> 2 ; "#54761" -> 54761 */
export function parseIntFrom(text: string): number {
  const match = text.match(/\d+/);
  if (!match) throw new Error(`No number found in "${text}"`);
  return Number(match[0]);
}
