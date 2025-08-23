import React, { useMemo, useCallback, useState, useRef } from 'react';
import { 
  FlatList, 
  View, 
  Text, 
  Dimensions,
  ViewabilityConfig,
  ViewToken,
  ListRenderItem
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LazyListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  
  // Performance options
  itemHeight?: number;
  overscan?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  
  // Lazy loading
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  
  // Visual options
  showsVerticalScrollIndicator?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  
  // Accessibility
  testID?: string;
}

export const LazyList = <T extends any>({
  data,
  renderItem,
  keyExtractor,
  itemHeight = 80,
  overscan = 2,
  windowSize = 10,
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  onEndReached,
  onEndReachedThreshold = 0.5,
  hasNextPage = false,
  isFetchingNextPage = false,
  showsVerticalScrollIndicator = false,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  testID,
}: LazyListProps<T>) => {
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());

  // Memoize the data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Optimized render item with visibility tracking
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(({ item, index }) => {
    const key = keyExtractor(item, index);
    const isVisible = viewableItems.has(key);
    
    // Only render complex content when item is visible or near viewport
    if (!isVisible && Math.abs(index - getCurrentViewportIndex()) > overscan) {
      return (
        <View 
          style={{ height: itemHeight }}
          accessible={false}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Loading...</Text>
          </View>
        </View>
      );
    }

    return renderItem({ item, index, separators: {} as any });
  }, [renderItem, keyExtractor, viewableItems, overscan, itemHeight]);

  // Track current viewport for optimization calculations
  const getCurrentViewportIndex = () => {
    const screenHeight = Dimensions.get('window').height;
    return Math.floor(screenHeight / itemHeight / 2);
  };

  // Viewability configuration for performance
  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  // Handle viewability changes
  const handleViewableItemsChanged = useCallback(({ viewableItems: visible }: { viewableItems: ViewToken[] }) => {
    const visibleKeys = new Set(visible.map(item => keyExtractor(item.item, item.index!)));
    setViewableItems(visibleKeys);
  }, [keyExtractor]);

  // Loading footer component
  const LoadingFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14 }}>⏳</Text>
          <Text 
            style={{ fontSize: 14, color: colors.textSecondary }}
          >
            Loading more...
          </Text>
        </View>
      </View>
    );
  };

  // Enhanced footer component
  const FooterComponent = () => (
    <>
      {ListFooterComponent}
      <LoadingFooter />
    </>
  );

  // Get item layout for better performance with known item heights
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }), [itemHeight]);

  // Handle scroll to top
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Handle scroll to index
  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  return (
    <FlatList
      ref={flatListRef}
      data={memoizedData}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      
      // Performance optimizations
      removeClippedSubviews={removeClippedSubviews}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      windowSize={windowSize}
      initialNumToRender={Math.ceil(Dimensions.get('window').height / itemHeight)}
      
      // Lazy loading
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={onEndReachedThreshold}
      
      // Viewability tracking
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={handleViewableItemsChanged}
      
      // Visual props
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={FooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      
      // Accessibility
      testID={testID}
      accessible={true}
      accessibilityRole="list"
      
      // Styling
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: colors.background,
      }}
      
      // Additional performance props
      keyboardShouldPersistTaps="handled"
      disableVirtualization={false}
    />
  );
};

// Hook for managing large lists
export const useLazyListManager = <T extends any>(
  initialData: T[],
  fetchMore: (page: number) => Promise<T[]>,
  pageSize: number = 20
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNextPage) return;

    setIsLoading(true);
    try {
      const newData = await fetchMore(page);
      
      if (newData.length < pageSize) {
        setHasNextPage(false);
      }
      
      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, page, pageSize, isLoading, hasNextPage]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setPage(1);
    setHasNextPage(true);
    
    try {
      const newData = await fetchMore(1);
      setData(newData);
      
      if (newData.length < pageSize) {
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchMore, pageSize]);

  return {
    data,
    isLoading,
    hasNextPage,
    loadMore,
    refresh,
  };
};