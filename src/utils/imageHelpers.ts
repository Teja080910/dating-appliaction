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
