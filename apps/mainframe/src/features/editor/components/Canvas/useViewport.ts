import { useCallback, useRef, useState, useEffect } from 'react';

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface ViewportConfig {
  canvasWidth: number;
  canvasHeight: number;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  boundaryPadding?: number;
}

const DEFAULTS = {
  initialScale: 1,
  minScale: 0.2,
  maxScale: 3,
  boundaryPadding: 0.1,
};

export default function useViewport(config: ViewportConfig) {
  const {
    canvasWidth,
    canvasHeight,
    initialScale = DEFAULTS.initialScale,
    minScale = DEFAULTS.minScale,
    maxScale = DEFAULTS.maxScale,
    boundaryPadding = DEFAULTS.boundaryPadding,
  } = config;

  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: initialScale });
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef(viewport);

  useEffect(() => { viewportRef.current = viewport; }, [viewport]);

  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    return { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight };
  }, []);

  const clampPosition = useCallback((x: number, y: number, scale: number) => {
    const { width: cw, height: ch } = getContainerSize();
    if (!cw || !ch || !canvasWidth || !canvasHeight) return { x, y };

    const sw = canvasWidth * scale;
    const sh = canvasHeight * scale;
    const minW = Math.min(sw * boundaryPadding, cw * 0.5);
    const minH = Math.min(sh * boundaryPadding, ch * 0.5);

    return {
      x: Math.max(minW - sw, Math.min(cw - minW, x)),
      y: Math.max(minH - sh, Math.min(ch - minH, y)),
    };
  }, [canvasWidth, canvasHeight, boundaryPadding, getContainerSize]);

  const updateViewport = useCallback((partial: Partial<ViewportState>) => {
    setViewport(prev => {
      const next = { ...prev, ...partial };
      const scale = Math.max(minScale, Math.min(maxScale, next.scale));
      const { x, y } = clampPosition(next.x, next.y, scale);
      return { x, y, scale };
    });
  }, [minScale, maxScale, clampPosition]);

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const v = viewportRef.current;
    return {
      x: (screenX - rect.left - v.x) / v.scale,
      y: (screenY - rect.top - v.y) / v.scale,
    };
  }, []);

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const v = viewportRef.current;
    return {
      x: canvasX * v.scale + v.x + rect.left,
      y: canvasY * v.scale + v.y + rect.top,
    };
  }, []);

  return {
    viewport,
    viewportRef,
    containerRef,
    getContainerSize,
    updateViewport,
    screenToCanvas,
    canvasToScreen,
    config: { minScale, maxScale, initialScale, canvasWidth, canvasHeight },
  };
}
