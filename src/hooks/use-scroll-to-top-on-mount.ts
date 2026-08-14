import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useScrollToTopOnMount() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);
}

