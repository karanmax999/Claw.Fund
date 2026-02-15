import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
  timestamp: number;
}

// Performance thresholds based on Web Vitals recommendations
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta),
    });
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Vercel Analytics
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('event', {
        name: 'web-vitals',
        data: {
          metric: metric.name,
          value: Math.round(metric.value),
          rating: metric.rating,
        },
      });
    }

    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta),
      });
    }
  }

  // Check performance budgets
  checkPerformanceBudget(metric);
}

function checkPerformanceBudget(metric: WebVitalsMetric) {
  if (metric.rating === 'poor') {
    console.warn(`[Performance Budget] ${metric.name} exceeded threshold:`, {
      value: Math.round(metric.value),
      threshold: THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.poor,
      rating: metric.rating,
    });
  }
}

function handleMetric(metric: Metric) {
  const webVitalsMetric: WebVitalsMetric = {
    id: metric.id,
    name: metric.name as WebVitalsMetric['name'],
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
  };

  sendToAnalytics(webVitalsMetric);
}

export function reportWebVitals() {
  try {
    onCLS(handleMetric);
    onFID(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  } catch (error) {
    // Fail silently - never impact user experience
    if (process.env.NODE_ENV === 'development') {
      console.error('[Web Vitals] Error reporting metrics:', error);
    }
  }
}

// Custom performance metrics
export function trackCustomMetric(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Custom Metric]', { name, value, unit });
  }

  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Send to analytics
    if ((window as any).va) {
      (window as any).va('event', {
        name: 'custom-metric',
        data: { metric: name, value, unit },
      });
    }
  }
}
