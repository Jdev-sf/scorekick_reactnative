import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useMemo, useCallback, useRef } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey'> {
  debounceMs?: number;
  dedupeInterval?: number;
  backgroundRefresh?: boolean;
  optimisticUpdate?: boolean;
}

interface OptimizedInfiniteQueryOptions<T> extends Omit<UseInfiniteQueryOptions<T>, 'queryKey'> {
  debounceMs?: number;
  dedupeInterval?: number;
  backgroundRefresh?: boolean;
  queryKey?: any[];
  getNextPageParam: (lastPage: T, allPages: T[]) => any;
  initialPageParam: any;
}

// Enhanced query hook with performance optimizations
export const useOptimizedQuery = <T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) => {
  const {
    debounceMs = 300,
    dedupeInterval = 5000,
    backgroundRefresh = true,
    optimisticUpdate = false,
    ...queryOptions
  } = options;

  const lastRequestTime = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize query key to prevent unnecessary re-renders
  const memoizedQueryKey = useMemo(() => queryKey, queryKey);

  // Debounced query function
  const debouncedQueryFn = useCallback(async () => {
    return new Promise<T>((resolve, reject) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        const now = Date.now();
        
        // Check if we should dedupe this request
        if (now - lastRequestTime.current < dedupeInterval) {
          return;
        }
        
        lastRequestTime.current = now;
        
        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
    });
  }, [queryFn, debounceMs, dedupeInterval]);

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: debouncedQueryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: backgroundRefresh,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Exponential backoff with max 3 retries
      if (failureCount >= 3) return false;
      
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) return false;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
};

// Optimized infinite query for large datasets
export const useOptimizedInfiniteQuery = <T>(
  queryKey: any[],
  queryFn: ({ pageParam }: { pageParam: any }) => Promise<T>,
  options: OptimizedInfiniteQueryOptions<T>
) => {
  const {
    debounceMs = 300,
    dedupeInterval = 5000,
    backgroundRefresh = true,
    getNextPageParam,
    initialPageParam,
    ...queryOptions
  } = options;

  const memoizedQueryKey = useMemo(() => queryKey, queryKey);

  return useInfiniteQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    getNextPageParam,
    initialPageParam,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // formerly cacheTime
    refetchOnWindowFocus: backgroundRefresh,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
};

// Memory management utilities
export const useQueryMemoryOptimization = () => {
  const clearStaleQueries = useCallback((queryClient: any) => {
    // Remove queries that haven't been used in the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    queryClient.getQueryCache().findAll().forEach((query: any) => {
      if (query.state.dataUpdatedAt < oneHourAgo && !query.getObserversCount()) {
        queryClient.removeQueries(query.queryKey);
      }
    });
  }, []);

  const optimizeCache = useCallback((queryClient: any) => {
    // Set shorter cache times for large datasets
    const largeDataQueries = ['leaderboards', 'matches', 'predictions'];
    
    largeDataQueries.forEach(queryType => {
      queryClient.setQueryDefaults([queryType], {
        gcTime: 5 * 60 * 1000, // 5 minutes instead of default (formerly cacheTime)
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    });
  }, []);

  return { clearStaleQueries, optimizeCache };
};

// Background sync optimization
export const useBackgroundSync = (
  syncFn: () => Promise<void>,
  interval: number = 30000, // 30 seconds
  enabled: boolean = true
) => {
  const lastSync = useRef<number>(0);
  const syncInProgress = useRef<boolean>(false);

  const performSync = useCallback(async () => {
    if (syncInProgress.current) return;
    
    const now = Date.now();
    if (now - lastSync.current < interval) return;

    syncInProgress.current = true;
    lastSync.current = now;

    try {
      await syncFn();
    } catch (error) {
      console.warn('Background sync failed:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [syncFn, interval]);

  // Trigger sync on app state change, network reconnection, etc.
  const triggerSync = useCallback(() => {
    if (enabled) {
      performSync();
    }
  }, [performSync, enabled]);

  return { triggerSync, isSync: syncInProgress.current };
};