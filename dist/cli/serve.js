// src/cli/serve.ts
/**
 * Run the serve command.
 *
 * --cloud: Run in proxy mode, forwarding to cloud server with auth from keychain
 * default: Run in local mode, using local keychain API key
 */
export async function runServeCli(options) {
    if (options.cloud) {
        // Proxy mode: STDIO -> Cloud with auth
        const { runProxyServer } = await import('../server/proxy-server.js');
        await runProxyServer(options.cloudUrl);
    }
    else {
        // Local mode: STDIO with local keychain
        const { runLocalServer } = await import('../index.js');
        await runLocalServer();
    }
}
//# sourceMappingURL=serve.js.map