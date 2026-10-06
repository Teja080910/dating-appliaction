export const APIURL: string = 'http://168.144.95.58:9395';
export const USE_MOCK: boolean = false;

// Warn if using plain HTTP in production environments
if (!USE_MOCK && typeof __DEV__ !== 'undefined' && !__DEV__ && !APIURL.startsWith('https://')) {
  console.warn('⚠️ Warning: Production APIURL should use HTTPS.');
}

