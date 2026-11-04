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
    return;
  }

  // If cold-starting from quit state, wait for navigation container to mount
  let attempts = 0;
  const maxAttempts = 40; // 4 seconds max (100ms * 40)
  const timer = setInterval(() => {
    attempts++;
    if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
      clearInterval(timer);
      try {
        navigationRef.navigate(name, params);
      } catch (e) {
        console.warn('⚠️ [Navigation] Deferred navigation failed:', e);
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(timer);
      console.warn('⚠️ [Navigation] Deferred navigation timed out waiting for NavigationContainer');
    }
  }, 100);
}

