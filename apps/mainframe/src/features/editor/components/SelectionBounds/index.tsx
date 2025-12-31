import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { ComponentSchema } from '@/types/schema';
import { getSelectionBounds, clampOffset } from '@/utils/geometry';
import './index.scss';

interface SelectionBoundsProps {
  components: ComponentSchema[];
  scale?: number;
  canvasSize?: { width: number; height: number };
}

const SelectionBounds: React.FC<SelectionBoundsProps> = ({ components, scale = 1, canvasSize }) => {
  const { selectedComponents, updateComponentsPosition, setDragOffset } = useCanvasStore();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false });

  const bounds = useMemo(
    () => getSelectionBounds(components, selectedComponents, scale),
    [selectedComponents, components, scale]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, dragging: true };
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = (e.clientX - dragRef.current.startX) / scale;
      const dy = (e.clientY - dragRef.current.startY) / scale;
      const clamped = clampOffset({ x: dx, y: dy }, bounds, canvasSize);
      setOffset(clamped);
      setDragOffset(clamped);
    };

    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;

      if (offset.x !== 0 || offset.y !== 0) {
        updateComponentsPosition(
          selectedComponents.map(id => ({ id, deltaX: offset.x, deltaY: offset.y })),
          true
        );
      } else {
        setDragOffset(null);
      }
      setOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [scale, bounds, canvasSize, setDragOffset, updateComponentsPosition, selectedComponents, offset]);

  if (!bounds) return null;

  const padding = 4;

  return (
    <div
      className="selection-bounds"
      style={{
        position: 'absolute',
        left: bounds.minX - padding + offset.x,
        top: bounds.minY - padding + offset.y,
        width: bounds.maxX - bounds.minX + padding * 2,
        height: bounds.maxY - bounds.minY + padding * 2,
        cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default SelectionBounds;
