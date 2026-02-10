import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Z_RESIZE_PREVIEW } from '@/constants/zIndex';
import './index.scss';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeHandlesProps {
  /** 当前组件样式 */
  style: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };
  /** 画布缩放 */
  scale: number;
  /** resize 完成回调 */
  onResizeEnd: (rect: { left: number; top: number; width: number; height: number }) => void;
  /** 是否可用 */
  enabled?: boolean;
}

const DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const CURSOR_MAP: Record<ResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const MIN_SIZE = 20;

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ style, scale, onResizeEnd, enabled = true }) => {
  const dragRef = useRef<{
    direction: ResizeDirection;
    startX: number;
    startY: number;
    startRect: { left: number; top: number; width: number; height: number };
  } | null>(null);

  const [delta, setDelta] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0, top: 0, width: 0, height: 0,
  });

  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((dir: ResizeDirection, e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();

    const el = (e.target as HTMLElement).closest('[data-component-id]') as HTMLElement;
    const rect = {
      left: 0,
      top: 0,
      width: style.width ?? (el ? el.offsetWidth : 100),
      height: style.height ?? (el ? el.offsetHeight : 40),
    };

    dragRef.current = {
      direction: dir,
      startX: e.clientX,
      startY: e.clientY,
      startRect: rect,
    };
    setDelta({ left: 0, top: 0, width: 0, height: 0 });
    setDragging(true);
  }, [enabled, style]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { direction, startX, startY, startRect } = dragRef.current;

      const dx = (e.clientX - startX) / scale;
      const dy = (e.clientY - startY) / scale;

      let dLeft = 0, dTop = 0, dWidth = 0, dHeight = 0;

      // 水平分量
      if (direction.includes('e')) {
        dWidth = dx;
      } else if (direction.includes('w')) {
        dWidth = -dx;
        dLeft = dx;
      }

      // 垂直分量
      if (direction.includes('s')) {
        dHeight = dy;
      } else if (direction.includes('n')) {
        dHeight = -dy;
        dTop = dy;
      }

      // 最小尺寸限制
      const newW = startRect.width + dWidth;
      const newH = startRect.height + dHeight;

      if (newW < MIN_SIZE) {
        if (direction.includes('w')) {
          dLeft = startRect.width - MIN_SIZE;
        }
        dWidth = MIN_SIZE - startRect.width;
      }
      if (newH < MIN_SIZE) {
        if (direction.includes('n')) {
          dTop = startRect.height - MIN_SIZE;
        }
        dHeight = MIN_SIZE - startRect.height;
      }

      // Shift 等比缩放
      if (e.shiftKey && (direction === 'ne' || direction === 'nw' || direction === 'se' || direction === 'sw')) {
        const ratio = startRect.width / (startRect.height || 1);
        if (Math.abs(dWidth) > Math.abs(dHeight) * ratio) {
          dHeight = dWidth / ratio;
          if (direction.includes('n')) dTop = -dHeight;
        } else {
          dWidth = dHeight * ratio;
          if (direction.includes('w')) dLeft = -dWidth;
        }
      }

      setDelta({ left: dLeft, top: dTop, width: dWidth, height: dHeight });
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { startRect } = dragRef.current;

      // 读取最新 delta
      setDelta(currentDelta => {
        const finalRect = {
          left: startRect.left + currentDelta.left,
          top: startRect.top + currentDelta.top,
          width: Math.max(MIN_SIZE, startRect.width + currentDelta.width),
          height: Math.max(MIN_SIZE, startRect.height + currentDelta.height),
        };
        onResizeEnd(finalRect);
        return { left: 0, top: 0, width: 0, height: 0 };
      });

      dragRef.current = null;
      setDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, scale, onResizeEnd]);

  // resize 过程中的覆盖样式
  const overlayStyle: React.CSSProperties | undefined = dragging && dragRef.current
    ? {
        position: 'absolute',
        left: delta.left,
        top: delta.top,
        width: `calc(100% + ${delta.width}px)`,
        height: `calc(100% + ${delta.height}px)`,
        border: '2px solid #1890ff',
        pointerEvents: 'none',
        zIndex: Z_RESIZE_PREVIEW,
        boxSizing: 'border-box',
      }
    : undefined;

  return (
    <>
      {dragging && overlayStyle && <div style={overlayStyle} />}
      {DIRECTIONS.map((dir) => (
        <div
          key={dir}
          className={`resize-handle resize-handle-${dir}`}
          style={{ cursor: CURSOR_MAP[dir] }}
          onMouseDown={(e) => handleMouseDown(dir, e)}
        />
      ))}
    </>
  );
};

export default ResizeHandles;
