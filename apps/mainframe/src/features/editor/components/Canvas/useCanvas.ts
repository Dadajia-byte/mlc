import { useEffect, useCallback, useRef, useState } from 'react';
import { ToolMode } from '@/types/schema';
import useViewport, { ViewportConfig } from './useViewport';
import useZoom from './useZoom';

export interface CanvasConfig extends ViewportConfig {
  scaleStep?: number;
  toolMode: ToolMode;
  initialCenter?: boolean;
  onViewportChange?: () => void;
}

const DEFAULT_SCALE_STEP = 0.1;

export default function useCanvas(config: CanvasConfig) {
  const {
    scaleStep = DEFAULT_SCALE_STEP,
    toolMode,
    initialCenter = true,
    onViewportChange,
    ...viewportConfig
  } = config;

  const {
    viewport,
    viewportRef,
    containerRef,
    getContainerSize,
    updateViewport,
    screenToCanvas,
    canvasToScreen,
    config: vpConfig,
  } = useViewport(viewportConfig);

  const { zoomTo, zoomIn, zoomOut, zoomToFit, centerCanvas } = useZoom(
    { ...vpConfig, scaleStep },
    { viewportRef, getContainerSize, updateViewport }
  );

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasInitializedRef = useRef(false);

  useEffect(() => { onViewportChange?.(); }, [viewport, onViewportChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isHand = toolMode === ToolMode.HAND;
    const isMiddle = e.button === 1;
    const isLeft = e.button === 0;
    const isOnViewport = e.target === e.currentTarget;

    if (isMiddle || (isHand && isLeft) || isOnViewport) {
      e.preventDefault();
      setIsDragging(true);
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const v = viewportRef.current;
      dragStartRef.current = {
        x: e.clientX - rect.left - v.x,
        y: e.clientY - rect.top - v.y,
      };
    }
  }, [toolMode, containerRef, viewportRef]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      updateViewport({
        x: e.clientX - rect.left - dragStartRef.current.x,
        y: e.clientY - rect.top - dragStartRef.current.y,
      });
    };

    const onUp = () => setIsDragging(false);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, updateViewport, containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewportRef.current;

      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = (mx - v.x) / v.scale;
        const cy = (my - v.y) / v.scale;
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.max(vpConfig.minScale, Math.min(vpConfig.maxScale, v.scale * delta));
        updateViewport({ x: mx - cx * newScale, y: my - cy * newScale, scale: newScale });
      } else {
        updateViewport({ x: v.x - e.deltaX, y: v.y - e.deltaY });
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [vpConfig.minScale, vpConfig.maxScale, updateViewport, containerRef, viewportRef]);

  useEffect(() => {
    if (!initialCenter || hasInitializedRef.current || !containerRef.current) return;

    const init = () => {
      const { width: cw, height: ch } = getContainerSize();
      if (cw > 0 && ch > 0) {
        const sw = vpConfig.canvasWidth * vpConfig.initialScale;
        const sh = vpConfig.canvasHeight * vpConfig.initialScale;
        updateViewport({ x: (cw - sw) / 2, y: (ch - sh) / 2, scale: vpConfig.initialScale });
        hasInitializedRef.current = true;
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(init));
  }, [initialCenter, vpConfig, getContainerSize, updateViewport, containerRef]);

  return {
    viewport,
    toolMode,
    isDragging,
    containerRef,
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
      width: vpConfig.canvasWidth,
      height: vpConfig.canvasHeight,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
      transformOrigin: 'top left',
    },
    config: { minScale: vpConfig.minScale, maxScale: vpConfig.maxScale, scaleStep },
  };
}
