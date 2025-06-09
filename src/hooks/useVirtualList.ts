"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
}

interface VirtualListItem {
  index: number;
  start: number;
  end: number;
}

export function useVirtualList({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5,
}: UseVirtualListOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      itemCount
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount, visibleEnd + overscan);

    const items: VirtualListItem[] = [];
    for (let i = start; i < end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
      });
    }

    return items;
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const totalHeight = itemCount * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
}

// Hook para lazy loading con Intersection Observer
export function useLazyLoading(threshold = 0.1, rootMargin = "50px") {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, threshold, rootMargin]);

  return { isIntersecting, setElement };
}

// Hook para manejo de scroll infinito
export function useInfiniteScroll(
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void
) {
  const { isIntersecting, setElement } = useLazyLoading(0.1, "100px");

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return { triggerRef: setElement };
}
