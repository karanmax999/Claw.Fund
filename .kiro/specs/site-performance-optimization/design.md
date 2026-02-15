# Design Document: Site Performance Optimization

## Overview

This design outlines a comprehensive performance optimization strategy for the CLAW.FUND Next.js application. The optimization addresses critical issues including WebSocket connection errors, font loading, bundle size, and overall performance metrics. The design follows Next.js 14 best practices and leverages built-in optimization features while adding custom solutions for specific performance bottlenecks.

The optimization strategy is structured around measurable improvements: eliminating 4565+ console errors, reducing bundle size by 20%, achieving Lighthouse scores of 95+, and improving Time to Interactive by 30%.

## Architecture

### High-Level Architecture

The performance optimization introduces several architectural improvements:

1. **Connection Management Layer**: Intelligent WebSocket connection handling with exponential backoff and graceful degradation
2. **Resource Loading Pipeline**: Optimized font, image, and component loading with strategic preloading
3. **Bundle Optimization**: Code splitting, dynamic imports, and tree-shaking configuration
4. **Performance Monitoring**: Real-time Web Vitals tracking and reporting
5. **Caching Strategy**: Service worker implementation for offline support and faster repeat visits

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Service    │◄────►│    Cache     │                     │
│  │   Worker     │      │   Storage    │                     │
│  └──────┬───────┘      └──────────────┘                     │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │           Next.js Application Layer                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │  WebSocket  │  │    Font      │  │   Image    │ │   │
│  │  │   Manager   │  │   Loader     │  │ Optimizer  │ │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │    Lazy     │  │  Animation   │  │Performance │ │   │
│  │  │   Loader    │  │ Controller   │  │  Monitor   │ │   │
│  │  └─────────────┘  └──────────────┘  └────────────┘ │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Backend  │        │   CDN    │        │Analytics │
   │WebSocket │        │  Fonts   │        │ Service  │
   └──────────┘        └──────────┘        └──────────┘
```

## Components and Interfaces

### 1. WebSocket Manager

**Purpose**: Manage WebSocket connections with intelligent retry logic and graceful degradation.

**Interface**:
```typescript
interface WebSocketManager {
  connect(): Promise<WebSocket | null>;
  disconnect(): void;
  getStatus(): ConnectionStatus;
  onStatusChange(callback: (status: ConnectionStatus) => void): void;
  send(data: any): boolean;
}

enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  FAILED = 'failed',
  STOPPED = 'stopped'
}

interface RetryConfig {
  initialDelay: number;      // 1000ms
  maxDelay: number;          // 30000ms
  maxRetries: number;        // 10
  backoffMultiplier: number; // 2
}
```

**Implementation Strategy**:
- Exponential backoff: delay = min(initialDelay * (backoffMultiplier ^ attemptNumber), maxDelay)
- After first failure, log warnings instead of errors
- After maxRetries, stop attempting and set status to STOPPED
- Provide connection status to UI for user feedback
- Check backend availability with HTTP health check before WebSocket connection
- Reset retry counter on successful connection

### 2. Font Loader Configuration

**Purpose**: Optimize font loading to prevent render blocking and layout shift.

**Configuration**:
```typescript
interface FontConfig {
  family: string;
  weights: number[];
  display: 'swap' | 'optional' | 'fallback';
  preload: boolean;
  subset?: string;
  fallback: string[];
}

const fontConfigs: FontConfig[] = [
  {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    display: 'swap',
    preload: true,
    subset: 'latin',
    fallback: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
  },
  {
    family: 'Space Grotesk',
    weights: [400, 500, 700],
    display: 'swap',
    preload: true,
    subset: 'latin',
    fallback: ['monospace']
  }
];
```

**Implementation Strategy**:
- Add `<link rel="preload">` tags in document head for critical fonts
- Use Next.js Font Optimization API (next/font)
- Configure font-display: swap in CSS
- Generate font subsets containing only Latin characters
- Use woff2 format for optimal compression
- Define fallback font stacks with similar metrics to prevent layout shift

### 3. Lazy Loading Strategy

**Purpose**: Defer loading of non-critical components to reduce initial bundle size.

**Interface**:
```typescript
interface LazyLoadConfig {
  component: () => Promise<any>;
  loading?: React.ComponentType;
  ssr?: boolean;
  suspense?: boolean;
}

// Components to lazy load
const lazyComponents = {
  // Charts (recharts is large)
  TreasuryChart: dynamic(() => import('@/components/charts/TreasuryChart'), {
    loading: () => <ChartSkeleton />,
    ssr: false
  }),
  
  // Modals and dialogs
  ProposalModal: dynamic(() => import('@/components/modals/ProposalModal'), {
    ssr: false
  }),
  
  // Dashboard widgets
  LiveFeed: dynamic(() => import('@/components/layout/LiveFeed'), {
    loading: () => <FeedSkeleton />
  }),
  
  // Heavy dependencies
  WalletConnector: dynamic(() => import('@/components/wallet/WalletConnector'), {
    ssr: false
  })
};
```

**Implementation Strategy**:
- Use Next.js dynamic imports with loading states
- Disable SSR for client-only components (charts, wallet)
- Implement skeleton loaders for better perceived performance
- Use Intersection Observer for viewport-based lazy loading
- Preload components on hover/focus for likely interactions

### 4. Image Optimization

**Purpose**: Optimize image delivery for faster loading and better user experience.

**Interface**:
```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}
```

**Implementation Strategy**:
- Replace all `<img>` tags with Next.js `<Image>` component
- Specify explicit width and height to prevent CLS
- Use priority prop for above-the-fold images
- Generate blur placeholders for smooth loading
- Configure responsive image sizes in next.config.js
- Use WebP format with automatic fallbacks
- Implement lazy loading for below-the-fold images

### 5. Bundle Analyzer and Optimization

**Purpose**: Identify and reduce JavaScript bundle size.

**Analysis Tools**:
```typescript
// next.config.js additions
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Optimization Strategies**:
- **Code Splitting**: Automatic route-based splitting by Next.js
- **Dynamic Imports**: Load heavy libraries on-demand
  - framer-motion: Import only used components
  - recharts: Load chart types dynamically
  - wagmi/rainbowkit: Load wallet connection on user action
- **Tree Shaking**: Configure package.json sideEffects
- **Dependency Audit**: Remove unused dependencies
- **Bundle Size Limits**: Set performance budgets in next.config.js

**Target Bundle Sizes**:
- Initial bundle: < 200KB (gzipped)
- Route chunks: < 100KB each (gzipped)
- Vendor chunks: < 150KB (gzipped)

### 6. Performance Monitor

**Purpose**: Track and report Web Vitals and custom performance metrics.

**Interface**:
```typescript
interface PerformanceMetrics {
  // Core Web Vitals
  LCP: number;  // Largest Contentful Paint
  FID: number;  // First Input Delay
  CLS: number;  // Cumulative Layout Shift
  FCP: number;  // First Contentful Paint
  TTI: number;  // Time to Interactive
  TTFB: number; // Time to First Byte
  
  // Custom metrics
  wsConnectionTime?: number;
  chartRenderTime?: number;
  routeChangeTime?: number;
}

interface PerformanceMonitor {
  trackMetric(name: string, value: number): void;
  reportMetrics(): void;
  setPerformanceBudget(metric: string, threshold: number): void;
}
```

**Implementation Strategy**:
- Use web-vitals library for Core Web Vitals tracking
- Report metrics to analytics service (e.g., Vercel Analytics, Google Analytics)
- Implement custom Performance Observer for specific metrics
- Set performance budgets and alert on regressions
- Track metrics in production environment only
- Use Navigation Timing API for custom measurements

### 7. Animation Controller

**Purpose**: Optimize animations for performance and accessibility.

**Interface**:
```typescript
interface AnimationConfig {
  reducedMotion: boolean;
  enableGPUAcceleration: boolean;
  maxConcurrentAnimations: number;
}

interface AnimationController {
  shouldAnimate(): boolean;
  getAnimationVariants(type: string): MotionVariants;
  limitConcurrency(animations: Animation[]): Animation[];
}
```

**Implementation Strategy**:
- Detect prefers-reduced-motion media query
- Provide simplified or disabled animations when reduced motion is preferred
- Use CSS transforms (translateX, translateY, scale) and opacity for GPU acceleration
- Avoid animating layout properties (width, height, margin, padding)
- Use will-change sparingly and remove after animation completes
- Limit concurrent animations to 3-5 to prevent jank
- Use framer-motion's useReducedMotion hook

**Animation Variants**:
```typescript
const animationVariants = {
  // Full animation
  full: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  // Reduced motion
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
};
```

### 8. Resource Hints

**Purpose**: Optimize external resource loading with browser hints.

**Configuration**:
```typescript
interface ResourceHints {
  preconnect: string[];    // Early connection establishment
  dnsPrefetch: string[];   // DNS resolution
  preload: string[];       // Critical resources
  prefetch: string[];      // Future navigation resources
}

const resourceHints: ResourceHints = {
  preconnect: [
    'https://mainnet.infura.io',  // RPC endpoint
    'https://fonts.googleapis.com' // Font CDN
  ],
  dnsPrefetch: [
    'https://api.coingecko.com',
    'https://cloudflare-eth.com'
  ],
  preload: [
    '/fonts/inter-var.woff2',
    '/fonts/space-grotesk.woff2'
  ],
  prefetch: [
    '/governance',  // Likely next page
    '/treasury'     // Likely next page
  ]
};
```

**Implementation Strategy**:
- Add resource hints to document head
- Use preconnect for critical third-party domains
- Use dns-prefetch for resources loaded later
- Preload critical fonts and CSS
- Implement link prefetching for common navigation paths
- Reduce prefetching on slow connections (Network Information API)

### 9. Service Worker

**Purpose**: Enable offline support and improve repeat visit performance.

**Interface**:
```typescript
interface ServiceWorkerConfig {
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  cacheName: string;
  cacheExpiration: number;
  offlineAssets: string[];
}

interface CacheStrategy {
  static: 'cache-first';      // JS, CSS, fonts, images
  api: 'network-first';        // API responses
  dynamic: 'stale-while-revalidate'; // HTML pages
}
```

**Implementation Strategy**:
- Use Workbox for service worker generation
- Cache static assets (JS, CSS, fonts, images) with cache-first strategy
- Cache API responses with network-first strategy and 5-minute TTL
- Cache HTML pages with stale-while-revalidate strategy
- Implement offline fallback page
- Provide offline status indicator in UI
- Skip service worker in development environment

**Cache Configuration**:
```typescript
const cacheConfig = {
  staticAssets: {
    strategy: 'CacheFirst',
    cacheName: 'static-assets-v1',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
    }
  },
  apiResponses: {
    strategy: 'NetworkFirst',
    cacheName: 'api-responses-v1',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 5 * 60 // 5 minutes
    }
  }
};
```

### 10. Virtual Scrolling

**Purpose**: Efficiently render large lists by only rendering visible items.

**Interface**:
```typescript
interface VirtualScrollerProps<T> {
  items: T[];
  itemHeight: number | ((item: T) => number);
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onScroll?: (scrollTop: number) => void;
}

interface VirtualScrollerState {
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
}
```

**Implementation Strategy**:
- Use react-virtual or react-window library
- Calculate visible range based on scroll position and viewport height
- Render visible items plus overscan buffer (5-10 items)
- Handle dynamic item heights with measurement cache
- Maintain scroll position during data updates
- Support keyboard navigation (arrow keys, page up/down)
- Apply only to lists with 100+ items

## Data Models

### Performance Metrics Model

```typescript
interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'TTI';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
  timestamp: number;
}

interface CustomMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  sessionId: string;
  url: string;
  userAgent: string;
  connectionType: string;
  webVitals: WebVitalsMetric[];
  customMetrics: CustomMetric[];
  timestamp: number;
}
```

### WebSocket Connection State

```typescript
interface ConnectionState {
  status: ConnectionStatus;
  retryCount: number;
  lastAttempt: number;
  lastSuccess: number | null;
  error: Error | null;
  backoffDelay: number;
}

interface ConnectionEvent {
  type: 'connecting' | 'connected' | 'disconnected' | 'error' | 'retry';
  timestamp: number;
  metadata?: {
    retryCount?: number;
    backoffDelay?: number;
    error?: string;
  };
}
```

### Bundle Analysis Model

```typescript
interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  timestamp: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  gzippedSize: number;
  usedBy: string[];
}
```

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Exponential Backoff Retry Pattern

*For any* sequence of failed WebSocket connection attempts, the delay between attempts should follow exponential backoff (delay = min(initialDelay × 2^attemptNumber, maxDelay)), and attempts should stop after reaching maxRetries.

**Validates: Requirements 1.1, 1.3**

### Property 2: Retry Counter Reset on Success

*For any* WebSocket connection that succeeds after previous failures, the retry counter should be reset to 0, so that subsequent failures start the backoff sequence from the beginning.

**Validates: Requirements 1.4**

### Property 3: Graceful Degradation on Connection Failure

*For any* application state when WebSocket connection fails, the application should continue rendering with cached or fallback data without throwing errors or breaking the UI.

**Validates: Requirements 1.5**

### Property 4: Connection Status Observable

*For any* WebSocket connection state change, registered observers should be notified with the new connection status.

**Validates: Requirements 1.6**

### Property 5: Font Loading Without Layout Shift

*For any* page load where custom fonts fail to load or are delayed, the Cumulative Layout Shift (CLS) metric should remain under 0.1.

**Validates: Requirements 2.6**

### Property 6: Lazy Loading Viewport Trigger

*For any* component marked for lazy loading, the component should not be loaded into memory until it enters the viewport (or within the overscan buffer).

**Validates: Requirements 3.1, 3.3**

### Property 7: Loading Placeholder Display

*For any* lazy-loaded component that is triggered but not yet loaded, a loading placeholder should be rendered in its place.

**Validates: Requirements 3.5**

### Property 8: Image Dimensions Specified

*For any* image rendered using the Image component, width and height properties should be specified to prevent layout shift.

**Validates: Requirements 4.2**

### Property 9: Below-Fold Image Lazy Loading

*For any* image that is below the fold (not in initial viewport), the image should have lazy loading enabled (loading="lazy" or priority=false).

**Validates: Requirements 4.4**

### Property 10: Responsive Image Sizes

*For any* image rendered using the Image component, responsive image sizes should be generated (srcset attribute with multiple size variants).

**Validates: Requirements 4.5**

### Property 11: Image Blur Placeholders

*For any* image that takes time to load, a blur placeholder should be displayed during loading to improve perceived performance.

**Validates: Requirements 4.6**

### Property 12: Performance Metrics Reporting

*For any* Web Vitals metric that is measured, the metric should be reported to the configured analytics or logging service.

**Validates: Requirements 6.2**

### Property 13: Performance Budget Alerts

*For any* performance metric that exceeds its configured threshold, a warning should be logged to alert developers of the regression.

**Validates: Requirements 6.4, 6.5**

### Property 14: Reduced Motion Respect

*For any* user with prefers-reduced-motion enabled, animations should be disabled or simplified to respect their accessibility preference.

**Validates: Requirements 7.1, 7.2**

### Property 15: GPU-Accelerated Animation Properties

*For any* animation defined in the application, only GPU-accelerated CSS properties (transform, opacity) should be animated, avoiding layout properties (width, height, top, left, margin, padding).

**Validates: Requirements 7.3, 7.4**

### Property 16: Animation Concurrency Limit

*For any* point in time during application execution, no more than the configured maximum number of animations (e.g., 5) should be running concurrently.

**Validates: Requirements 7.5**

### Property 17: Will-Change Property Management

*For any* element with will-change CSS property, the property should be removed after the animation completes to avoid memory overhead.

**Validates: Requirements 7.6**

### Property 18: Adaptive Prefetching on Slow Connections

*For any* user on a slow network connection (detected via Network Information API), the number of prefetched resources should be reduced compared to fast connections.

**Validates: Requirements 8.6**

### Property 19: Service Worker Cache Expiration

*For any* cached API response in the service worker cache, the response should be evicted after its configured TTL expires.

**Validates: Requirements 9.2**

### Property 20: Offline Content Serving

*For any* request made while the user is offline, if a cached version exists, the service worker should serve the cached content instead of failing.

**Validates: Requirements 9.3**

### Property 21: Cache Strategy Implementation

*For any* resource type (static assets, API responses, HTML pages), the appropriate caching strategy (cache-first, network-first, stale-while-revalidate) should be applied based on resource characteristics.

**Validates: Requirements 9.4, 9.5**

### Property 22: Offline Status Indication

*For any* time when the user goes offline, an offline status indicator should be displayed in the UI.

**Validates: Requirements 9.6**

### Property 23: Virtual Scrolling Render Optimization

*For any* list with more than 100 items, only the visible items plus overscan buffer should be rendered in the DOM, not the entire list.

**Validates: Requirements 10.1**

### Property 24: Virtual Scrolling Position Stability

*For any* data update in a virtual scrolled list, the scroll position should remain stable (not jump) unless explicitly changed by user interaction.

**Validates: Requirements 10.2**

### Property 25: Virtual Scrolling Dynamic Heights

*For any* virtual scrolled list with items of varying heights, the scroll position and visible range calculations should correctly account for dynamic item heights.

**Validates: Requirements 10.3**

### Property 26: Virtual Scrolling Performance

*For any* rapid scrolling in a virtual scrolled list with 100+ items, the frame rate should maintain 60fps (frame time < 16.67ms).

**Validates: Requirements 10.4**

### Property 27: Virtual Scrolling Keyboard Navigation

*For any* virtual scrolled list, keyboard navigation (arrow keys, page up/down, home/end) should correctly update the scroll position and focus.

**Validates: Requirements 10.5**

## Error Handling

### WebSocket Connection Errors

**Error Scenarios**:
1. Backend server unavailable
2. Network connectivity issues
3. WebSocket protocol errors
4. Authentication failures

**Handling Strategy**:
- First failure: Log error with full details
- Subsequent failures: Log warnings with retry count
- After max retries: Log final error and stop attempting
- Provide user-facing connection status indicator
- Never crash or break the application due to connection failures
- Always provide fallback data or graceful degradation

**Error Messages**:
```typescript
// First failure
console.error('[WebSocket] Connection failed:', error, { attempt: 1 });

// Subsequent failures
console.warn('[WebSocket] Retry attempt failed:', { attempt: retryCount, nextRetry: backoffDelay });

// Max retries reached
console.error('[WebSocket] Max retries reached. Stopping connection attempts.', { totalAttempts: maxRetries });
```

### Font Loading Errors

**Error Scenarios**:
1. Font file fails to download
2. Font file is corrupted
3. CDN is unavailable

**Handling Strategy**:
- Always define fallback font stacks
- Use font-display: swap to prevent invisible text
- Monitor font loading with Font Loading API
- Log font loading failures for monitoring
- Never block rendering waiting for fonts

### Image Loading Errors

**Error Scenarios**:
1. Image file not found (404)
2. Image file corrupted
3. Network timeout

**Handling Strategy**:
- Provide fallback images or placeholders
- Use onError handler to display error state
- Log image loading failures for monitoring
- Maintain layout with specified dimensions even on error
- Consider retry logic for transient failures

### Performance Monitoring Errors

**Error Scenarios**:
1. Analytics service unavailable
2. Performance API not supported
3. Metric calculation errors

**Handling Strategy**:
- Wrap all performance monitoring in try-catch
- Fail silently - never impact user experience
- Log monitoring errors to console in development
- Provide feature detection for Performance APIs
- Gracefully degrade if APIs unavailable

### Service Worker Errors

**Error Scenarios**:
1. Service worker registration fails
2. Cache storage quota exceeded
3. Cache corruption

**Handling Strategy**:
- Detect service worker support before registration
- Handle registration failures gracefully
- Implement cache eviction when quota exceeded
- Clear corrupted caches and rebuild
- Application should work without service worker

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and configuration
- **Property tests**: Verify universal properties across all inputs and states

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs and verify specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: site-performance-optimization, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: site-performance-optimization, Property 1: Exponential Backoff Retry Pattern
test('WebSocket retry follows exponential backoff', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10 }), // retry attempt number
      (attemptNumber) => {
        const initialDelay = 1000;
        const maxDelay = 30000;
        const backoffMultiplier = 2;
        
        const delay = calculateBackoffDelay(attemptNumber, initialDelay, maxDelay, backoffMultiplier);
        const expectedDelay = Math.min(initialDelay * Math.pow(backoffMultiplier, attemptNumber), maxDelay);
        
        expect(delay).toBe(expectedDelay);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Focus Areas**:
1. **WebSocket Manager**: Test connection lifecycle, retry logic, status changes
2. **Font Loading**: Verify preload tags, font-display configuration
3. **Lazy Loading**: Test component loading triggers, placeholder rendering
4. **Image Optimization**: Verify Image component usage, dimensions, lazy loading
5. **Performance Monitor**: Test metric collection, reporting, threshold alerts
6. **Animation Controller**: Test reduced motion detection, animation variants
7. **Service Worker**: Test caching strategies, offline behavior
8. **Virtual Scrolling**: Test visible range calculation, scroll position stability

**Example Unit Tests**:
```typescript
describe('WebSocket Manager', () => {
  it('should log error on first connection failure', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const manager = new WebSocketManager();
    
    manager.connect(); // simulate failure
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WebSocket] Connection failed'),
      expect.any(Error),
      expect.objectContaining({ attempt: 1 })
    );
  });
  
  it('should log warning on subsequent failures', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    const manager = new WebSocketManager();
    
    manager.connect(); // first failure
    manager.connect(); // second failure
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WebSocket] Retry attempt failed'),
      expect.objectContaining({ attempt: 2 })
    );
  });
});

describe('Font Loading', () => {
  it('should include preload tags for critical fonts', () => {
    render(<App />);
    
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
    const fontFamilies = Array.from(preloadLinks).map(link => 
      link.getAttribute('href')
    );
    
    expect(fontFamilies).toContain(expect.stringContaining('inter'));
    expect(fontFamilies).toContain(expect.stringContaining('space-grotesk'));
  });
});
```

### Integration Testing

**Focus Areas**:
1. End-to-end performance measurement
2. Service worker caching behavior
3. Lazy loading with real components
4. WebSocket connection with mock server

**Tools**:
- Playwright or Cypress for E2E tests
- Lighthouse CI for performance regression testing
- Network throttling for slow connection testing

### Performance Testing

**Metrics to Track**:
- Bundle size (initial, route chunks, vendor chunks)
- Web Vitals (LCP, FID, CLS, FCP, TTI, TTFB)
- Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Custom metrics (WebSocket connection time, chart render time)

**Performance Budgets**:
```typescript
const performanceBudgets = {
  initialBundle: { max: 200, unit: 'KB' },
  routeChunk: { max: 100, unit: 'KB' },
  vendorChunk: { max: 150, unit: 'KB' },
  LCP: { max: 2500, unit: 'ms' },
  FID: { max: 100, unit: 'ms' },
  CLS: { max: 0.1, unit: 'score' },
  FCP: { max: 1500, unit: 'ms' },
  TTI: { max: 3500, unit: 'ms' },
  lighthouseScore: { min: 95, unit: 'score' }
};
```

**Continuous Monitoring**:
- Run Lighthouse CI on every PR
- Track bundle size changes in CI
- Alert on performance budget violations
- Monitor Web Vitals in production with real user data

### Test Coverage Goals

- Unit test coverage: 80%+ for optimization utilities
- Property test coverage: All 27 correctness properties
- Integration test coverage: Critical user flows
- Performance test coverage: All performance budgets

### Testing Tools and Libraries

- **Unit Testing**: Jest, React Testing Library
- **Property Testing**: fast-check
- **E2E Testing**: Playwright
- **Performance Testing**: Lighthouse CI, web-vitals
- **Bundle Analysis**: @next/bundle-analyzer, webpack-bundle-analyzer
- **Visual Regression**: Percy or Chromatic (optional)
