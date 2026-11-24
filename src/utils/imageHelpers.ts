export const collectImageUris = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectImageUris(item));
  }

  if (value && typeof value === 'object') {
    const imageObject = value as Record<string, unknown>;
    return [
      ...collectImageUris(imageObject.imageUrl),
      ...collectImageUris(imageObject.profileImageUrl),
      ...collectImageUris(imageObject.url),
      ...collectImageUris(imageObject.uri),
      ...collectImageUris(imageObject.path),
      ...collectImageUris(imageObject.image),
      ...collectImageUris(imageObject.photos),
      ...collectImageUris(imageObject.photo),
    ];
  }

  return [];
};

export const dedupeImageUris = (items: unknown[]): string[] => {
  const seen = new Set<string>();
  const resolved: string[] = [];

  items
    .flatMap((item) => collectImageUris(item))
    .forEach((item) => {
      const normalized = item.trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      resolved.push(normalized);
    });

  return resolved;
};

export const padToSlots = (photos: (string | null)[], totalSlots = 6): (string | null)[] => {
  const result: (string | null)[] = [...photos.filter(Boolean)];
  while (result.length < totalSlots) {
    result.push(null);
  }
  return result;
};

export const getFilenameFromUrl = (u?: string | null): string => {
  if (!u) return '';
  const clean = u.split('?')[0].split('#')[0];
  return clean.substring(clean.lastIndexOf('/') + 1);
};

export const isDeletedPhotoUri = (
  uri: string | null | undefined,
  deletedList: string[],
  getAbsoluteUrlFn?: (url: string | null | undefined) => string
): boolean => {
  if (!uri || !Array.isArray(deletedList) || deletedList.length === 0) return false;
  const clean = uri.trim();
  if (!clean) return false;
  const abs = getAbsoluteUrlFn ? getAbsoluteUrlFn(clean) : clean;
  const filename = getFilenameFromUrl(clean).toLowerCase();
  const isGeneric =
    ['photo.jpg', 'image.jpg', 'default.jpg'].includes(filename) ||
    filename.startsWith('gallery_') ||
    filename.startsWith('photo_') ||
    filename.startsWith('image_') ||
    filename.startsWith('rn_image_picker');

  const isRemoteUrl = (u: string) => /^https?:\/\//i.test(u.trim());

  return deletedList.some((d) => {
    if (!d) return false;
    const cleanD = String(d).trim();
    if (!cleanD) return false;
    if (cleanD === clean || cleanD === abs) return true;
    const dAbs = getAbsoluteUrlFn ? getAbsoluteUrlFn(cleanD) : cleanD;
    if (dAbs === abs || dAbs === clean) return true;
    const dFile = getFilenameFromUrl(cleanD).toLowerCase();
    if (filename && dFile && !isGeneric && filename === dFile) {
      // Remote photos are identified by their full URL: the backend reuses
      // names like /amara/SA1000/3.jpg, so a stale tombstone must not hide a
      // freshly uploaded photo. Filename matching only applies to device-local
      // URIs (file://, content://).
      return !isRemoteUrl(clean);
    }
    return false;
  });
};
