'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/webVitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Only report in browser environment
    if (typeof window !== 'undefined') {
      reportWebVitals();
    }
  }, []);

  return null; // This component doesn't render anything
}
