import fs from 'node:fs';
import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';
import { env } from '../config/env';
import type { UserRole } from '../auth/users';
import { getUser, isSessionFresh, storageStatePath, TOKEN_STORAGE_KEY } from '../auth/users';

/**
 * Builds an API request context authorised as the given role. The token is obtained once per role
 * and reused: if the browser session saved by the auth fixture is still fresh its token is reused,
 * otherwise the role is logged in through POST /auth/login and the token is saved as a browser
 * storage state, so UI and API tests share the same session and each role logs in only once.
 */
export async function newApiContext(role: UserRole): Promise<APIRequestContext> {
  const token = await getToken(role);
  return request.newContext({
    baseURL: `${env.apiBaseUrl}/`,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function getToken(role: UserRole): Promise<string> {
  if (isSessionFresh(role)) {
    const saved = readSavedToken(role);
    if (saved) return saved;
  }
  return apiLogin(role);
}

function readSavedToken(role: UserRole): string | undefined {
  const file = storageStatePath(role);
  if (!fs.existsSync(file)) return undefined;
  const state = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
    origins?: { localStorage: { name: string; value: string }[] }[];
  };
  return state.origins
    ?.flatMap((origin) => origin.localStorage)
    .find((item) => item.name === TOKEN_STORAGE_KEY)?.value;
}

/** Logs the role in through the API and saves a browser storage state so the token is reused everywhere. */
async function apiLogin(role: UserRole): Promise<string> {
  const { email, password } = getUser(role);
  const context = await request.newContext({ baseURL: `${env.apiBaseUrl}/` });
  try {
    const response = await context.post('auth/login', { data: { email, password } });
    if (!response.ok()) {
      throw new Error(
        `API login for "${role}" failed (${response.status()}). Check data/testcredentials.json.\n${await response.text()}`,
      );
    }
    const token = (await response.json()).token as string | undefined;
    if (!token) throw new Error(`API login for "${role}" returned no token.`);
    saveStorageState(role, token);
    return token;
  } finally {
    await context.dispose();
  }
}

/** Writes the token in Playwright's storage-state shape so a browser context can reuse it too. */
function saveStorageState(role: UserRole, token: string): void {
  const file = storageStatePath(role);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const state = {
    cookies: [],
    origins: [{ origin: env.baseUrl, localStorage: [{ name: TOKEN_STORAGE_KEY, value: token }] }],
  };
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}
