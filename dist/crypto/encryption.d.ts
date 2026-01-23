/**
 * Encrypts a string using AES-256-GCM.
 * Returns base64-encoded string containing IV + ciphertext + auth tag.
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypts a string that was encrypted with encrypt().
 */
export declare function decrypt(encryptedBase64: string): string;
//# sourceMappingURL=encryption.d.ts.map