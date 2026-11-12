import { APIRequestContext, expect } from '@playwright/test';

/** Reads every page of a paginated list endpoint (max page size is 100). */
export async function listAll<T>(api: APIRequestContext, path: string): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?';
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const response = await api.get(`${path}${separator}limit=100&page=${page}`);
    expect(response.status(), `GET ${path}`).toBe(200);
    const body = await response.json();
    items.push(...body.data);
    if (page >= (body.pagination?.totalPages ?? 1)) return items;
  }
}
