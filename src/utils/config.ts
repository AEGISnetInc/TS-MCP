export interface Config {
  touchstoneBaseUrl: string;
}

export function getConfig(): Config {
  return {
    touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net'
  };
}
