import { useRef, MouseEvent, useCallback } from 'react';

export function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const onMouseDown = useCallback((e: MouseEvent) => {
    // Middle mouse button (button 1)
    if (e.button === 1 && ref.current) {
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.pageX - ref.current.offsetLeft;
      startY.current = e.pageY - ref.current.offsetTop;
      scrollLeft.current = ref.current.scrollLeft;
      scrollTop.current = ref.current.scrollTop;
      ref.current.style.cursor = 'grabbing';
      ref.current.style.userSelect = 'none';
    }
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (ref.current) {
      ref.current.style.cursor = '';
      ref.current.style.removeProperty('user-select');
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    isDragging.current = false;
    if (ref.current) {
      ref.current.style.cursor = '';
      ref.current.style.removeProperty('user-select');
    }
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const y = e.pageY - ref.current.offsetTop;
    const walkX = (x - startX.current);
    const walkY = (y - startY.current);
    ref.current.scrollLeft = scrollLeft.current - walkX;
    ref.current.scrollTop = scrollTop.current - walkY;
  }, []);

  return { ref, onMouseDown, onMouseUp, onMouseLeave, onMouseMove };
}
