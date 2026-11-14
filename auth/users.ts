import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import credentials from '../data/testcredentials.json';
import { decryptText, isEncrypted } from '../utils/credentialsCrypto';

/**
 * Test accounts. Credentials live in data/testcredentials.json (template:
 * data/testcredentials.example.json). A password is either plain text or encrypted
 * ("<iv>:<data>:<tag>"); encrypted ones are decrypted with the CREDENTIALS_KEY passphrase
 * (see README). A role added there is picked up everywhere: the auth fixture logs it in,
 * and specs can use it with test.use({ role: '<name>' }).
 */
export type UserRole = keyof typeof credentials;

/** 'anonymous' = a visitor who is not logged in (no saved session). */
export type Role = UserRole | 'anonymous';

export const USER_ROLES = Object.keys(credentials) as UserRole[];

/** The account a worker runs as by default: one account per worker, so workers never share data. */
export function roleForWorker(parallelIndex: number): UserRole {
  return USER_ROLES[parallelIndex % USER_ROLES.length];
}

export function getUser(role: UserRole): { email: string; password: string } {
  const { email, password } = credentials[role];
  if (!isEncrypted(password)) return { email, password };
  const key = process.env.CREDENTIALS_KEY;
  if (!key) throw new Error(`The password of "${role}" is encrypted: set CREDENTIALS_KEY (see README).`);
  return { email, password: decryptText(password, key) };
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
