import crypto from 'node:crypto';

// Ensure these are set in your .env file
const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY']; // Must be 256 bits (32 bytes)
const ENCRYPTION_IV = process.env['ENCRYPTION_IV'];   // Must be 128 bits (16 bytes)
const ALGORITHM = 'aes-256-cbc';

// Helper to generate keys for development (should not be used in production directly)
function generateKeyAndIV(): { key: string; iv: string } {
  const key = crypto.randomBytes(32).toString('hex'); // 256 bits
  const iv = crypto.randomBytes(16).toString('hex');  // 128 bits
  return { key, iv };
}

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  const { key, iv } = generateKeyAndIV();
  console.warn(`
  ============================================================
  WARNING: ENCRYPTION_KEY or ENCRYPTION_IV is not set.
  For development, you can use these in your .env file:
  ENCRYPTION_KEY="${key}"
  ENCRYPTION_IV="${iv}"
  ============================================================
  `);
}

/**
 * @function encrypt
 * @description Encrypts a given text using AES-256-CBC algorithm.
 * @param {string} text - The text to encrypt.
 * @returns {string} The encrypted text in hexadecimal format.
 * @throws {Error} If ENCRYPTION_KEY or ENCRYPTION_IV are not set.
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption key or IV not set. Cannot encrypt.');
  }

  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  const ivBuffer = Buffer.from(ENCRYPTION_IV, 'hex');

  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * @function decrypt
 * @description Decrypts a given hexadecimal string using AES-256-CBC algorithm.
 * @param {string} encryptedText - The encrypted text in hexadecimal format.
 * @returns {string} The decrypted text.
 * @throws {Error} If ENCRYPTION_KEY or ENCRYPTION_IV are not set.
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
    throw new Error('Encryption key or IV not set. Cannot decrypt.');
  }

  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
  const ivBuffer = Buffer.from(ENCRYPTION_IV, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
