// src/services/encryptionService.ts
import crypto from 'node:crypto';

export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor() {
        // La clave debe tener 32 bytes para AES-256
        this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
    }

    encrypt(text: string): string {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag();

            // Combinar IV + datos encriptados + auth tag
            return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
        } catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    decrypt(encryptedData: string): string {
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            const authTag = Buffer.from(parts[2], 'hex');

            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Método para encriptar campos opcionales (pueden ser null o undefined)
    encryptOptional(text?: string | null): string | null {
        if (!text) return null;
        return this.encrypt(text);
    }

    // Método para desencriptar campos opcionales
    decryptOptional(encryptedData?: string | null): string | null {
        if (!encryptedData) return null;
        return this.decrypt(encryptedData);
    }

    // Método para verificar si un texto está encriptado
    isEncrypted(text: string): boolean {
        return text.split(':').length === 3;
    }
}

export const encryptionService = new EncryptionService();
