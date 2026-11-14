import { decryptText, encryptText } from '../utils/credentialsCrypto';

/**
 * Encrypt or decrypt one password from the terminal (run through the npm scripts):
 *   $env:CREDENTIALS_KEY="<passphrase>"
 *   npm run credentials:encrypt -- "MyPassword1."      prints the value to paste into data/testcredentials.json
 *   npm run credentials:decrypt -- "<iv>:<data>:<tag>"  prints the plain password
 */
const [command, value] = process.argv.slice(2);
const key = process.env.CREDENTIALS_KEY;

if (!key || !value || (command !== 'encrypt' && command !== 'decrypt')) {
  console.error('Usage: set $env:CREDENTIALS_KEY first, then: tsx scripts/credentials.ts <encrypt|decrypt> "<value>"');
  process.exit(1);
}

console.log(command === 'encrypt' ? encryptText(value, key) : decryptText(value, key));
