import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/** Encrypted password format: "<iv>:<data>:<authTag>", all hex (AES-256-GCM). */
const ENCRYPTED_PATTERN = /^[0-9a-f]{24}:[0-9a-f]+:[0-9a-f]{32}$/;

function deriveKey(passphrase: string): Buffer {
  return scryptSync(passphrase, 'eventhub-qa-automation', 32);
}

export function isEncrypted(value: string): boolean {
  return ENCRYPTED_PATTERN.test(value);
}

export function encryptText(plain: string, passphrase: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(passphrase), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), data.toString('hex'), cipher.getAuthTag().toString('hex')].join(':');
}

export function decryptText(encrypted: string, passphrase: string): string {
  const [iv, data, tag] = encrypted.split(':');
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(passphrase), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  try {
    return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Could not decrypt the password: CREDENTIALS_KEY is missing or wrong.');
  }
}
