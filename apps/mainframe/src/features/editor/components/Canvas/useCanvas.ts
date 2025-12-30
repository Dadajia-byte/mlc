import { useEffect, useCallback, useRef, useState } from 'react';
import { ToolMode } from '@/types/schema';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface CanvasConfig {
  canvasWidth: number;
  canvasHeight: number;
  initialScale?: number;
  maxScale?: number;
  minScale?: number;
  scaleStep?: number;
  boundaryPadding?: number;
  initialToolMode?: ToolMode;
  initialCenter?: boolean;
  onViewportChange?: () => void;
}

const DEFAULT_CONFIG = {
  initialScale: 1,
  minScale: 0.2,
  maxScale: 3,
  scaleStep: 0.1,
  boundaryPadding: 0.1,
  initialCenter: true,
};

export default function useCanvas(config: CanvasConfig) {
  const {
    canvasWidth,
    canvasHeight,
    initialScale = DEFAULT_CONFIG.initialScale,
    minScale = DEFAULT_CONFIG.minScale,
    maxScale = DEFAULT_CONFIG.maxScale,
    scaleStep = DEFAULT_CONFIG.scaleStep,
    boundaryPadding = DEFAULT_CONFIG.boundaryPadding,
    initialToolMode = ToolMode.MOUSE,
    initialCenter = DEFAULT_CONFIG.initialCenter,
    onViewportChange,
  } = config;

  // State
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: initialScale });
  const [toolMode, setToolMode] = useState<ToolMode>(initialToolMode);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<ViewportState>(viewport);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasInitializedRef = useRef(false);

  // 同步 viewport 到 ref
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // 获取容器尺寸
  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
  }, []);

  // 限制视口位置
  const clampPosition = useCallback((x: number, y: number, scale: number) => {
    const { width: containerWidth, height: containerHeight } = getContainerSize();
    if (!containerWidth || !containerHeight || !canvasWidth || !canvasHeight) {
      return { x, y };
    }

    const scaledCanvasWidth = canvasWidth * scale;
    const scaledCanvasHeight = canvasHeight * scale;
    const minVisibleWidth = Math.min(scaledCanvasWidth * boundaryPadding, containerWidth * 0.5);
    const minVisibleHeight = Math.min(scaledCanvasHeight * boundaryPadding, containerHeight * 0.5);

    return {
      x: Math.max(minVisibleWidth - scaledCanvasWidth, Math.min(containerWidth - minVisibleWidth, x)),
      y: Math.max(minVisibleHeight - scaledCanvasHeight, Math.min(containerHeight - minVisibleHeight, y)),
    };
  }, [canvasWidth, canvasHeight, boundaryPadding, getContainerSize]);

  // 更新视口（带边界限制）
  const updateViewport = useCallback((newState: Partial<ViewportState>) => {
    setViewport((prev) => {
      const next = { ...prev, ...newState };
      const scale = Math.max(minScale, Math.min(maxScale, next.scale));
      const { x, y } = clampPosition(next.x, next.y, scale);
      return { x, y, scale };
    });
  }, [minScale, maxScale, clampPosition]);

  // 监听变化，触发回调
  useEffect(() => { onViewportChange?.(); }, [viewport, onViewportChange]);
  useEffect(() => { onViewportChange?.(); }, [toolMode, onViewportChange]);

  // 缩放到指定比例（以视口中心为基准）
  const zoomTo = useCallback((newScale: number) => {
    const { width: containerWidth, height: containerHeight } = getContainerSize();
    if (!containerWidth || !containerHeight) {
      updateViewport({ scale: newScale });
      return;
    }

    const current = viewportRef.current;
    const centerX = (containerWidth / 2 - current.x) / current.scale;
    const centerY = (containerHeight / 2 - current.y) / current.scale;

    updateViewport({
      x: containerWidth / 2 - centerX * newScale,
      y: containerHeight / 2 - centerY * newScale,
      scale: newScale,
    });
  }, [getContainerSize, updateViewport]);

  const zoomIn = useCallback(() => {
    zoomTo(Math.min(maxScale, viewportRef.current.scale + scaleStep));
  }, [maxScale, scaleStep, zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(Math.max(minScale, viewportRef.current.scale - scaleStep));
  }, [minScale, scaleStep, zoomTo]);

  const zoomToFit = useCallback(() => {
    const { width: containerWidth, height: containerHeight } = getContainerSize();
    if (!containerWidth || !containerHeight || !canvasWidth || !canvasHeight) return;

    const newScale = Math.min(containerWidth / canvasWidth, containerHeight / canvasHeight, 1);
    const scaledWidth = canvasWidth * newScale;
    const scaledHeight = canvasHeight * newScale;

    updateViewport({
      x: (containerWidth - scaledWidth) / 2,
      y: (containerHeight - scaledHeight) / 2,
      scale: newScale,
    });
  }, [canvasWidth, canvasHeight, getContainerSize, updateViewport]);

  const centerCanvas = useCallback(() => {
    const { width: containerWidth, height: containerHeight } = getContainerSize();
    if (!containerWidth || !containerHeight || !canvasWidth || !canvasHeight) return;

    const current = viewportRef.current;
    updateViewport({
      x: (containerWidth - canvasWidth * current.scale) / 2,
      y: (containerHeight - canvasHeight * current.scale) / 2,
    });
  }, [canvasWidth, canvasHeight, getContainerSize, updateViewport]);

  // 坐标转换（屏幕转画布）
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const current = viewportRef.current;
    return {
      x: (screenX - rect.left - current.x) / current.scale,
      y: (screenY - rect.top - current.y) / current.scale,
    };
  }, []);

  // 坐标转换（画布转屏幕）
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const current = viewportRef.current;
    return {
      x: canvasX * current.scale + current.x + rect.left,
      y: canvasY * current.scale + current.y + rect.top,
    };
  }, []);

  // 鼠标按下（拖拽画布）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isHandMode = toolMode === ToolMode.HAND;
    const isMiddleButton = e.button === 1;
    const isLeftButton = e.button === 0;
    const isClickOnViewport = e.target === e.currentTarget;

    if (isMiddleButton || (isHandMode && isLeftButton) || isClickOnViewport) {
      e.preventDefault();
      setIsDragging(true);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const current = viewportRef.current;

      dragStartRef.current = {
        x: e.clientX - rect.left - current.x,
        y: e.clientY - rect.top - current.y,
      };
    }
  }, [toolMode]);

  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      updateViewport({
        x: e.clientX - rect.left - dragStartRef.current.x,
        y: e.clientY - rect.top - dragStartRef.current.y,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateViewport]);

  // 滚轮缩放/平移
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const current = viewportRef.current;

        const canvasX = (mouseX - current.x) / current.scale;
        const canvasY = (mouseY - current.y) / current.scale;
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.max(minScale, Math.min(maxScale, current.scale * delta));

        updateViewport({
          x: mouseX - canvasX * newScale,
          y: mouseY - canvasY * newScale,
          scale: newScale,
        });
      } else {
        const current = viewportRef.current;
        updateViewport({
          x: current.x - e.deltaX,
          y: current.y - e.deltaY,
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [minScale, maxScale, updateViewport]);

  // 初始化居中
  useEffect(() => {
    if (!initialCenter || hasInitializedRef.current || !containerRef.current) return;

    const initCenter = () => {
      const { width: containerWidth, height: containerHeight } = getContainerSize();
      if (containerWidth > 0 && containerHeight > 0) {
        const scaledWidth = canvasWidth * initialScale;
        const scaledHeight = canvasHeight * initialScale;
        updateViewport({
          x: (containerWidth - scaledWidth) / 2,
          y: (containerHeight - scaledHeight) / 2,
          scale: initialScale,
        });
        hasInitializedRef.current = true;
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(initCenter));
  }, [initialCenter, initialScale, canvasWidth, canvasHeight, getContainerSize, updateViewport]);

  return {
    viewport,
    toolMode,
    isDragging,
    containerRef,
    setToolMode,
    zoomIn,
    zoomOut,
    zoomTo,
    zoomToFit,
    centerCanvas,
    screenToCanvas,
    canvasToScreen,
    containerProps: {
      onMouseDown: handleMouseDown,
      style: {
        cursor: isDragging ? 'grabbing' : toolMode === ToolMode.HAND ? 'grab' : 'default',
        userSelect: 'none' as const,
      },
    },
    canvasStyle: {
      width: canvasWidth,
      height: canvasHeight,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
      transformOrigin: 'top left',
    },
    config: { minScale, maxScale, scaleStep },
  };
}
