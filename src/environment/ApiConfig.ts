// Production must provide an HTTPS API URL. The current HTTP endpoint is retained
// only for local/mock development until the backend supplies its TLS hostname.
export const APIURL: string = 'http://168.144.95.58:9395';
export const USE_MOCK: boolean = true;

if (!USE_MOCK && !APIURL.startsWith('https://')) {
  throw new Error('Production APIURL must use HTTPS.');
}
