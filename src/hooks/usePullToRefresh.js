import { useState, useRef, useCallback } from 'react';

const THRESHOLD = 72; // px to pull before triggering
const RESISTANCE = 2.5;

export function usePullToRefresh(onRefresh) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    // Only allow pull when already scrolled to the top
    if (el.scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) { startYRef.current = null; return; }

    const delta = (e.touches[0].clientY - startYRef.current) / RESISTANCE;
    if (delta > 0) {
      setPullDistance(Math.min(delta, THRESHOLD * 1.5));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    startYRef.current = null;

    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  return { containerRef, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}