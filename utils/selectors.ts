/**
 * Fills {placeholders} in a selector alias.
 *   withParams('[data-testid="booking-card"]:has(.booking-ref:text-is("{ref}"))', { ref: 'C-AB12CD' })
 * Values are escaped so quotes or backslashes in data (e.g. event titles) cannot break the selector.
 */
export function withParams(selector: string, params: Record<string, string | number>): string {
  return selector.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in params)) throw new Error(`Missing value for {${key}} in selector: ${selector}`);
    return String(params[key]).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  });
}
