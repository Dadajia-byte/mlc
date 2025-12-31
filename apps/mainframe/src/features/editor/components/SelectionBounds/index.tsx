import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { ComponentSchema } from '@/types/schema';
import './index.scss';

interface SelectionBoundsProps {
  components: ComponentSchema[];
  scale?: number;
  canvasSize?: { width: number; height: number };
}

const SelectionBounds: React.FC<SelectionBoundsProps> = ({ components, scale = 1, canvasSize }) => {
  const { selectedComponents, updateComponentsPosition, setDragOffset } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const [localOffset, setLocalOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 计算包围框（基于 DOM 实际尺寸）
  const bounds = useMemo(() => {
    if (selectedComponents.length <= 1) return null;

    const selectedComps = components.filter(c => selectedComponents.includes(c.id));
    if (selectedComps.length <= 1) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    selectedComps.forEach(comp => {
      const left = (comp.style?.left as number) || 0;
      const top = (comp.style?.top as number) || 0;
      
      // 尝试从 DOM 获取实际尺寸
      const domElement = document.querySelector(`[data-component-id="${comp.id}"]`) as HTMLElement;
      let width = (comp.style?.width as number) || 0;
      let height = (comp.style?.height as number) || 0;
      
      if (domElement) {
        const rect = domElement.getBoundingClientRect();
        // 需要除以 scale 得到实际尺寸
        width = rect.width / scale;
        height = rect.height / scale;
      }
      
      // 如果还是 0，使用最小默认值
      if (width === 0) width = 50;
      if (height === 0) height = 20;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + width);
      maxY = Math.max(maxY, top + height);
    });

    return {
      x: minX - 4,
      y: minY - 4,
      width: maxX - minX + 8,
      height: maxY - minY + 8,
      // 保存原始边界用于限制拖拽
      originalMinX: minX,
      originalMinY: minY,
      originalMaxX: maxX,
      originalMaxY: maxY,
    };
  }, [selectedComponents, components, scale]);

  // 限制偏移量在画布范围内
  const clampOffset = useCallback((deltaX: number, deltaY: number) => {
    if (!bounds || !canvasSize) return { x: deltaX, y: deltaY };
    
    // 计算移动后的边界
    const newMinX = bounds.originalMinX + deltaX;
    const newMinY = bounds.originalMinY + deltaY;
    const newMaxX = bounds.originalMaxX + deltaX;
    const newMaxY = bounds.originalMaxY + deltaY;
    
    let clampedX = deltaX;
    let clampedY = deltaY;
    
    // 限制左边界
    if (newMinX < 0) {
      clampedX = deltaX - newMinX;
    }
    // 限制右边界
    if (newMaxX > canvasSize.width) {
      clampedX = deltaX - (newMaxX - canvasSize.width);
    }
    // 限制上边界
    if (newMinY < 0) {
      clampedY = deltaY - newMinY;
    }
    // 限制下边界
    if (newMaxY > canvasSize.height) {
      clampedY = deltaY - (newMaxY - canvasSize.height);
    }
    
    return { x: clampedX, y: clampedY };
  }, [bounds, canvasSize]);

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = { x: 0, y: 0 };
    setIsDragging(true);
    setLocalOffset({ x: 0, y: 0 });
  }, []);

  // 处理拖拽
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rawDeltaX = (e.clientX - dragStartRef.current.x) / scale;
      const rawDeltaY = (e.clientY - dragStartRef.current.y) / scale;
      
      // 限制在画布范围内
      const clamped = clampOffset(rawDeltaX, rawDeltaY);
      
      dragOffsetRef.current = clamped;
      setLocalOffset(clamped);
      // 更新全局拖动偏移，让组件实时跟随
      setDragOffset(clamped);
    };

    const handleMouseUp = () => {
      const offset = dragOffsetRef.current;
      
      // 原子操作：同时更新位置并清除 dragOffset，避免闪烁
      if (offset.x !== 0 || offset.y !== 0) {
        const updates = selectedComponents.map(id => ({
          id,
          deltaX: offset.x,
          deltaY: offset.y,
        }));
        updateComponentsPosition(updates, true); // 第二个参数表示同时清除 dragOffset
      } else {
        setDragOffset(null);
      }
      
      setIsDragging(false);
      setLocalOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedComponents, updateComponentsPosition, setDragOffset, scale, clampOffset]);

  if (!bounds) return null;

  return (
    <div
      className={`selection-bounds ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: bounds.x + localOffset.x,
        top: bounds.y + localOffset.y,
        width: bounds.width,
        height: bounds.height,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default SelectionBounds;
