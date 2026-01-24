import keytar from 'keytar';
export const SERVICE_NAME = 'ts-mcp';
export const ACCOUNT_NAME = 'touchstone-api-key';
export const CREDENTIALS_ACCOUNT = 'touchstone-credentials';
export class KeychainService {
    async getApiKey() {
        return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    async setApiKey(apiKey) {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
    }
    async deleteApiKey() {
        return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    }
    async hasApiKey() {
        const key = await this.getApiKey();
        return key !== null;
    }
    async getCredentials() {
        const stored = await keytar.getPassword(SERVICE_NAME, CREDENTIALS_ACCOUNT);
        if (!stored)
            return null;
        try {
            return JSON.parse(stored);
        }
        catch {
            return null;
        }
    }
    async setCredentials(username, password) {
        const credentials = { username, password };
        await keytar.setPassword(SERVICE_NAME, CREDENTIALS_ACCOUNT, JSON.stringify(credentials));
    }
    async deleteCredentials() {
        return keytar.deletePassword(SERVICE_NAME, CREDENTIALS_ACCOUNT);
    }
    async hasCredentials() {
        const creds = await this.getCredentials();
        return creds !== null;
    }
}
//# sourceMappingURL=keychain.js.map