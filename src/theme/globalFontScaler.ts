import { StyleSheet } from 'react-native';

const SCALED_MARKER = Symbol('AMARA_FONT_SCALED');

export const computeScaledFontSize = (size: number): number => {
  if (typeof size !== 'number' || isNaN(size) || size <= 0) return size;
  const decrease = size >= 26 ? 2.5 : size >= 18 ? 1.5 : size >= 12 ? 1 : 0.8;
  return Math.max(8.5, Math.round((size - decrease) * 10) / 10);
};

export const computeScaledLineHeight = (lh: number, fontSize?: number): number => {
  if (typeof lh !== 'number' || isNaN(lh) || lh <= 0) return lh;
  const decrease = lh >= 30 ? 2.5 : lh >= 22 ? 1.5 : 1;
  const target = Math.round((lh - decrease) * 10) / 10;
  return fontSize ? Math.max(fontSize + 1.5, target) : target;
};

const scaleStyleObject = (style: any): any => {
  if (!style || typeof style !== 'object' || Array.isArray(style) || (style as any)[SCALED_MARKER]) {
    return style;
  }

  let hasChanged = false;
  const updated: any = { ...style };

  if (typeof updated.fontSize === 'number' && updated.fontSize > 0) {
    const newFs = computeScaledFontSize(updated.fontSize);
    if (newFs !== updated.fontSize) {
      updated.fontSize = newFs;
      hasChanged = true;
    }
  }

  if (typeof updated.lineHeight === 'number' && updated.lineHeight > 0) {
    const newLh = computeScaledLineHeight(updated.lineHeight, updated.fontSize);
    if (newLh !== updated.lineHeight) {
      updated.lineHeight = newLh;
      hasChanged = true;
    }
  }

  try {
    Object.defineProperty(updated, SCALED_MARKER, {
      value: true,
      enumerable: false,
      writable: false,
    });
  } catch {}

  return hasChanged ? updated : style;
};

const scaleStylesMap = <T extends Record<string, any>>(styles: T): T => {
  if (!styles || typeof styles !== 'object') return styles;
  const result: any = {};
  for (const key of Object.keys(styles)) {
    const val = styles[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = scaleStyleObject(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
};

// Global interceptor for StyleSheet.create to scale font sizes everywhere in the app
const originalCreate = StyleSheet.create;

(StyleSheet as any).create = function <T extends Record<string, any>>(styles: T): T {
  const scaled = scaleStylesMap(styles);
  return originalCreate(scaled);
};
