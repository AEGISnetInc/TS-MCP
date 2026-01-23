import keytar from 'keytar';
export const SERVICE_NAME = 'ts-mcp';
export const ACCOUNT_NAME = 'touchstone-api-key';
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
}
//# sourceMappingURL=keychain.js.map