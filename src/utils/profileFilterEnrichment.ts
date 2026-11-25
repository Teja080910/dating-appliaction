import apiClient from '../api/apiClient';
import { normalizeProfile } from '../api/useProfile';

/**
 * `/search` returns UserSearchResponse, which does not include englishLevel or
 * ethnicity. When those filters are active we fetch the full profile for the
 * candidates and merge the missing fields so the client-side filter can work.
 */
interface FilterMeta {
  englishLevel: string;
  ethnicity: string;
}

const EMPTY_META: FilterMeta = { englishLevel: '', ethnicity: '' };
const metaCache = new Map<string, FilterMeta>();
const inFlight = new Map<string, Promise<FilterMeta>>();

const resolveUid = (item: any): string =>
  String(item?.userId ?? item?.profile?.userId ?? item?.id ?? '').trim();

const fetchMeta = async (uid: string): Promise<FilterMeta> => {
  const cached = metaCache.get(uid);
  if (cached) return cached;

  const existing = inFlight.get(uid);
  if (existing) return existing;

  const request = (async () => {
    try {
      const res = await apiClient
        .get(`/profile/me/${uid}`)
        .catch(() => apiClient.post('/profile/me', null, { params: { userId: uid } }))
        .catch(() => apiClient.get('/profile/me', { params: { userId: uid } }))
        .catch(() => apiClient.get(`/profile/get/${uid}`));

      const profile = normalizeProfile(res?.data);
      const meta: FilterMeta = {
        englishLevel: String(profile?.englishLevel || '').trim(),
        ethnicity: String(profile?.ethnicity || '').trim(),
      };
      metaCache.set(uid, meta);
      return meta;
    } catch {
      metaCache.set(uid, EMPTY_META);
      return EMPTY_META;
    } finally {
      inFlight.delete(uid);
    }
  })();

  inFlight.set(uid, request);
  return request;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<void> => {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
};

export const enrichProfilesWithFilterFields = async (
  items: any[],
  need: { english?: boolean; ethnicity?: boolean }
): Promise<any[]> => {
  if (!Array.isArray(items) || items.length === 0) return items;
  if (!need.english && !need.ethnicity) return items;

  const indicesByUid = new Map<string, number[]>();

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const profile = item?.profile || item;
    const missingEnglish =
      need.english && !String(profile?.englishLevel ?? item?.englishLevel ?? '').trim();
    const missingEthnicity =
      need.ethnicity && !String(profile?.ethnicity ?? item?.ethnicity ?? '').trim();
    if (!missingEnglish && !missingEthnicity) return;

    const uid = resolveUid(item);
    if (!uid) return;

    const indices = indicesByUid.get(uid) || [];
    indices.push(index);
    indicesByUid.set(uid, indices);
  });

  if (indicesByUid.size === 0) return items;

  try {
    await mapWithConcurrency([...indicesByUid.keys()], 8, async (uid) => {
    const meta = await fetchMeta(uid);
    if (!meta.englishLevel && !meta.ethnicity) return;

    for (const index of indicesByUid.get(uid) || []) {
      const item = items[index];
      const mergedEnglish = item?.englishLevel || meta.englishLevel;
      const mergedEthnicity = item?.ethnicity || meta.ethnicity;
      items[index] = {
        ...item,
        ...(mergedEnglish ? { englishLevel: mergedEnglish } : {}),
        ...(mergedEthnicity ? { ethnicity: mergedEthnicity } : {}),
        ...(item?.profile && typeof item.profile === 'object'
          ? {
              profile: {
                ...item.profile,
                ...(mergedEnglish ? { englishLevel: item.profile.englishLevel || mergedEnglish } : {}),
                ...(mergedEthnicity ? { ethnicity: item.profile.ethnicity || mergedEthnicity } : {}),
              },
            }
          : {}),
      };
    }
    });
  } catch (e) {
    console.warn('[profileFilterEnrichment] enrichment failed:', e);
  }

  return items;
};

export const clearProfileFilterMetaCache = () => {
  metaCache.clear();
  inFlight.clear();
};
