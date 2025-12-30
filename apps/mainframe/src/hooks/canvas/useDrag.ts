import { useRef, useState, useCallback, useEffect } from 'react';

export interface DragPosition {
  x: number;
  y: number;
}

export interface UseDragOptions {
  initialPosition?: DragPosition;
  enabled?: boolean;
  scale?: number;
  containerRef?: React.RefObject<HTMLElement>;
  onDragStart?: (position: DragPosition) => void;
  onDrag?: (position: DragPosition, delta: DragPosition) => void;
  onDragEnd?: (position: DragPosition) => void;
}

export default function useDrag(options: UseDragOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    enabled = true,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  const [position, setPosition] = useState<DragPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<DragPosition>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLElement>(null);

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX - position.x;
      const startY = e.clientY - position.y;

      dragStartPos.current = { x: startX, y: startY };
      setIsDragging(true);
      onDragStart?.(position);
    },
    [enabled, position, onDragStart]
  );

  // 处理鼠标移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      const delta = {
        x: newX - position.x,
        y: newY - position.y,
      };

      setPosition({ x: newX, y: newY });
      onDrag?.({ x: newX, y: newY }, delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.(position);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, onDrag, onDragEnd]);

  return {
    position,
    isDragging,
    dragProps: {
      ref: elementRef,
      onMouseDown: handleMouseDown,
      style: {
        position: 'absolute' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : (enabled ? 'grab' : 'default'),
        userSelect: 'none' as const,
      },
    },
  };
}