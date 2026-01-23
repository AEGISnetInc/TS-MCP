export interface ServeOptions {
    cloud?: boolean;
    cloudUrl?: string;
}
/**
 * Run the serve command.
 *
 * --cloud: Run in proxy mode, forwarding to cloud server with auth from keychain
 * default: Run in local mode, using local keychain API key
 */
export declare function runServeCli(options: ServeOptions): Promise<void>;
//# sourceMappingURL=serve.d.ts.map