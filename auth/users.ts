import fs from 'node:fs';
import path from 'node:path';
import credentials from '../data/testcredentials.json';

/**
 * Test accounts. Credentials live in data/testcredentials.json (git-ignored, template:
 * data/testcredentials.example.json). A role added there is picked up everywhere:
 * the auth fixture logs it in, and specs can use it with test.use({ role: '<name>' }).
 */
export type UserRole = keyof typeof credentials;

/** 'anonymous' = a visitor who is not logged in (no saved session). */
export type Role = UserRole | 'anonymous';

export const USER_ROLES = Object.keys(credentials) as UserRole[];

export function getUser(role: UserRole): { email: string; password: string } {
  return credentials[role];
}

/** Where the auth fixture saves the logged-in browser session of a role. */
export function storageStatePath(role: UserRole): string {
  return path.join(__dirname, '..', '.auth', `${role}.json`);
}

/** A saved session is reused for this long; after that the framework logs in again. */
const SESSION_TTL_MS = 30 * 60 * 1000;

export function isSessionFresh(role: UserRole): boolean {
  const file = storageStatePath(role);
  return fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < SESSION_TTL_MS;
}

/** localStorage key in which the web app keeps the session token (reused for API calls). */
export const TOKEN_STORAGE_KEY = 'eventhub_token';
