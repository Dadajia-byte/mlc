import React, { useState, useCallback, useEffect } from 'react';
import { ComponentSchema, ToolMode } from '@/types/schema';
import './index.scss';

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSelectionProps {
  /** 屏幕坐标转画布坐标的函数 */
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  /** 组件列表 */
  components: ComponentSchema[];
  /** 画布容器引用，用于判断点击是否在画布上 */
  canvasContainerRef: React.RefObject<HTMLElement>;
  /** 工具模式 */
  toolMode: ToolMode;
}

const CanvasSelection: React.FC<CanvasSelectionProps> = ({
  screenToCanvas,
  components,
  canvasContainerRef,
  toolMode,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

  const container = canvasContainerRef.current;
  // 处理鼠标按下
  const handleMouseDown = useCallback((e: MouseEvent) => {
    
    if (!container || toolMode !== ToolMode.MOUSE) return;

    // 只响应左键
    if (e.button !== 0) return;

    // 如果点击的是组件，不启动框选（让组件自己处理拖拽）
    const target = e.target as HTMLElement;
    if (target.closest('[data-component-id]')) {
      return;
    }

    // 只在点击画布空白区域时启动框选
    if (target !== container && !container.contains(target)) {
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionBox(null);

    e.preventDefault();
    e.stopPropagation();
  }, [toolMode, screenToCanvas, container]);

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !selectionStart) return;

      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      const left = Math.min(selectionStart.x, x);
      const top = Math.min(selectionStart.y, y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);

      setSelectionBox({ x: left, y: top, width, height });
    },
    [isSelecting, selectionStart, screenToCanvas]
  );

  // 处理鼠标抬起
  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionBox(null);
  }, [isSelecting]);

  // 监听全局鼠标抬起（防止鼠标移出画布后无法结束框选）
  useEffect(() => {
    if (!isSelecting) return;

    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionBox(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting]);

  // 绑定事件监听器
  useEffect(() => {
    if (toolMode !== ToolMode.MOUSE || !container) return;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [toolMode, canvasContainerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  // 如果没有选框，不渲染
  if (!selectionBox) return null;

  return (
    <div
      className="canvas-selection"
      style={{
        position: 'absolute',
        left: selectionBox.x,
        top: selectionBox.y,
        width: selectionBox.width,
        height: selectionBox.height,
        pointerEvents: 'none',
      }}
    />
  );
};

export default CanvasSelection;