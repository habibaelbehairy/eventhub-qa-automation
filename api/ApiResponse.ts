import type { APIResponse } from '@playwright/test';

/** The JSON envelope every EventHub endpoint answers with. */
export interface ApiBody {
  success?: boolean;
  // The payload differs per endpoint (event, booking, list); specs read it and check the fields they need.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
  details?: { field: string; message?: string }[];
}

/** A response with its HTTP `status` as a number and the JSON `body` already parsed. */
export class ApiResponse<T = ApiBody> {
  constructor(
    readonly status: number,
    readonly body: T,
  ) {}
}

/** Reads the status and the JSON body of a Playwright response. A body that is not JSON stays as text. */
export async function toApiResponse(response: APIResponse): Promise<ApiResponse> {
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // Not JSON: keep the raw text so a failing check can still show it.
  }
  return new ApiResponse(response.status(), body as ApiBody);
}
