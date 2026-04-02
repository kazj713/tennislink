/**
 * 虚拟化列表组件
 * 用于处理长列表的性能优化
 */

'use client';

import { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onEndReached,
  onScroll,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // 检查是否滚动到底部
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      onEndReached?.();
    }
  }, [onEndReached, onScroll]);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const itemsToRender = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      itemsToRender.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }}
          className="absolute left-0 right-0"
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
    return itemsToRender;
  }, [items, visibleRange, itemHeight, renderItem]);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto relative', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 占位容器 */}
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * 网格虚拟化组件
 */
interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  gap = 0,
  overscan = 2,
  className,
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 计算每行列数
  const columnsCount = useMemo(() => {
    return Math.floor((containerWidth + gap) / (itemWidth + gap));
  }, [containerWidth, itemWidth, gap]);

  // 计算总行数
  const rowsCount = useMemo(() => {
    return Math.ceil(items.length / columnsCount);
  }, [items.length, columnsCount]);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      rowsCount - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    
    const startCol = Math.max(0, Math.floor(scrollLeft / (itemWidth + gap)) - overscan);
    const endCol = Math.min(
      columnsCount - 1,
      Math.ceil((scrollLeft + containerWidth) / (itemWidth + gap)) + overscan
    );
    
    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, itemHeight, itemWidth, containerHeight, containerWidth, gap, overscan, rowsCount, columnsCount]);

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // 渲染可见项目
  const visibleItems = useMemo(() => {
    const itemsToRender = [];
    
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const index = row * columnsCount + col;
        if (index < items.length) {
          itemsToRender.push(
            <div
              key={index}
              style={{
                position: 'absolute',
                top: row * (itemHeight + gap),
                left: col * (itemWidth + gap),
                width: itemWidth,
                height: itemHeight,
              }}
            >
              {renderItem(items[index], index)}
            </div>
          );
        }
      }
    }
    
    return itemsToRender;
  }, [items, visibleRange, columnsCount, itemHeight, itemWidth, gap, renderItem]);

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto relative', className)}
      style={{ 
        height: containerHeight, 
        width: containerWidth 
      }}
      onScroll={handleScroll}
    >
      {/* 占位容器 */}
      <div
        style={{
          height: rowsCount * (itemHeight + gap) - gap,
          width: columnsCount * (itemWidth + gap) - gap,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}