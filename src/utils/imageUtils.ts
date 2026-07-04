import { APIURL } from '../environment/ApiConfig';

export const resolveImageUri = (img: string | null | undefined): string => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('/')) return `${APIURL}${img}`;
  return `${APIURL}/${img}`;
};

export const parseImageList = (response: any): { id: number; imageUrl: string }[] => {
  if (!response) return [];
  const raw = response?.data || response?.images || response;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null) {
    const values = Object.values(raw);
    if (values.length > 0 && Array.isArray(values[0])) return values[0];
  }
  return [];
};
