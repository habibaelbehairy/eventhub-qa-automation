import fs from 'node:fs';
import { request, APIRequestContext } from '@playwright/test';
import { env } from '../config/env';
import { storageStatePath, TOKEN_STORAGE_KEY, UserRole } from '../auth/users';

/**
 * Builds an API request context authorised as the given role. It reuses the token the auth fixture
 * saved with the browser session, so each role logs in once for both UI and API.
 */
export async function newApiContext(role: UserRole): Promise<APIRequestContext> {
  return request.newContext({
    baseURL: `${env.apiBaseUrl}/`,
    extraHTTPHeaders: { Authorization: `Bearer ${readSavedToken(role)}` },
  });
}

function readSavedToken(role: UserRole): string {
  const file = storageStatePath(role);
  if (!fs.existsSync(file)) {
    throw new Error(
      `No saved session for "${role}" (${file}). Use the "page" fixture (or an fixture that depends on it) so the framework logs the role in first.`,
    );
  }
  const state = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
    origins: { localStorage: { name: string; value: string }[] }[];
  };
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((item) => item.name === TOKEN_STORAGE_KEY)?.value;
  if (!token) throw new Error(`No "${TOKEN_STORAGE_KEY}" in the saved session of "${role}". Delete the .auth folder and re-run.`);
  return token;
}
