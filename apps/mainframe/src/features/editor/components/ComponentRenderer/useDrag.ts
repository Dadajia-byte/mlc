import { useRef, useState, useCallback, useEffect } from 'react';

export interface DragPosition {
  x: number;
  y: number;
}

export interface UseDragOptions {
  initialPosition?: DragPosition;
  enabled?: boolean;
  scale?: number;
  bounds?: {
    minX?: number;
    minY?: number;
    maxX?: number;
    maxY?: number;
  };
  onDragStart?: (position: DragPosition) => void;
  onDrag?: (position: DragPosition, delta: DragPosition) => void;
  onDragEnd?: (position: DragPosition, delta?: DragPosition) => void;
}

export default function useDrag(options: UseDragOptions = {}) {
  const {
    initialPosition = { x: 0, y: 0 },
    enabled = true,
    scale = 1,
    bounds,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  const [position, setPosition] = useState<DragPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<DragPosition>({ x: 0, y: 0 });
  const positionRef = useRef<DragPosition>(position);
  const totalDeltaRef = useRef<DragPosition>({ x: 0, y: 0 });

  // 限制位置在边界内
  const clampPosition = useCallback((pos: DragPosition): DragPosition => {
    if (!bounds) return pos;
    return {
      x: Math.max(bounds.minX ?? -Infinity, Math.min(bounds.maxX ?? Infinity, pos.x)),
      y: Math.max(bounds.minY ?? -Infinity, Math.min(bounds.maxY ?? Infinity, pos.y)),
    };
  }, [bounds]);

  // 同步 position 到 ref
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // 当 initialPosition 变化且未在拖拽时，同步位置
  useEffect(() => {
    if (!isDragging) {
      setPosition(initialPosition);
    }
  }, [initialPosition.x, initialPosition.y, isDragging]);

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      dragStartPos.current = { x: e.clientX, y: e.clientY };
      totalDeltaRef.current = { x: 0, y: 0 };
      setIsDragging(true);
      onDragStart?.(positionRef.current);
    },
    [enabled, onDragStart]
  );

  // 处理鼠标移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStartPos.current.x) / scale;
      const deltaY = (e.clientY - dragStartPos.current.y) / scale;

      const rawPos = {
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY,
      };
      const clampedPos = clampPosition(rawPos);

      const delta = {
        x: clampedPos.x - positionRef.current.x,
        y: clampedPos.y - positionRef.current.y,
      };

      // 累计总位移
      totalDeltaRef.current = {
        x: clampedPos.x - initialPosition.x,
        y: clampedPos.y - initialPosition.y,
      };

      setPosition(clampedPos);
      onDrag?.(clampedPos, delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.(positionRef.current, totalDeltaRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale, initialPosition.x, initialPosition.y, clampPosition, onDrag, onDragEnd]);

  return {
    position,
    isDragging,
    dragProps: {
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
