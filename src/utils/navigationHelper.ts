import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef =
  typeof createNavigationContainerRef === 'function'
    ? createNavigationContainerRef<any>()
    : ({
        isReady: () => false,
        navigate: () => undefined,
      } as any);

export function navigate(name: string, params?: any) {
  if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

