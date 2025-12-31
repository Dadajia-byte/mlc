import { useCallback } from 'react';
import { ViewportState } from './useViewport';

interface UseZoomConfig {
  minScale: number;
  maxScale: number;
  scaleStep: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface UseZoomDeps {
  viewportRef: React.RefObject<ViewportState>;
  getContainerSize: () => { width: number; height: number };
  updateViewport: (partial: Partial<ViewportState>) => void;
}

export default function useZoom(config: UseZoomConfig, deps: UseZoomDeps) {
  const { minScale, maxScale, scaleStep, canvasWidth, canvasHeight } = config;
  const { viewportRef, getContainerSize, updateViewport } = deps;

  const zoomTo = useCallback((newScale: number) => {
    const { width: cw, height: ch } = getContainerSize();
    if (!cw || !ch) {
      updateViewport({ scale: newScale });
      return;
    }
    const v = viewportRef.current;
    const cx = (cw / 2 - v.x) / v.scale;
    const cy = (ch / 2 - v.y) / v.scale;
    updateViewport({
      x: cw / 2 - cx * newScale,
      y: ch / 2 - cy * newScale,
      scale: newScale,
    });
  }, [getContainerSize, updateViewport, viewportRef]);

  const zoomIn = useCallback(() => {
    zoomTo(Math.min(maxScale, viewportRef.current.scale + scaleStep));
  }, [maxScale, scaleStep, zoomTo, viewportRef]);

  const zoomOut = useCallback(() => {
    zoomTo(Math.max(minScale, viewportRef.current.scale - scaleStep));
  }, [minScale, scaleStep, zoomTo, viewportRef]);

  const zoomToFit = useCallback(() => {
    const { width: cw, height: ch } = getContainerSize();
    if (!cw || !ch || !canvasWidth || !canvasHeight) return;

    const newScale = Math.min(cw / canvasWidth, ch / canvasHeight, 1);
    updateViewport({
      x: (cw - canvasWidth * newScale) / 2,
      y: (ch - canvasHeight * newScale) / 2,
      scale: newScale,
    });
  }, [canvasWidth, canvasHeight, getContainerSize, updateViewport]);

  const centerCanvas = useCallback(() => {
    const { width: cw, height: ch } = getContainerSize();
    if (!cw || !ch || !canvasWidth || !canvasHeight) return;
    const v = viewportRef.current;
    updateViewport({
      x: (cw - canvasWidth * v.scale) / 2,
      y: (ch - canvasHeight * v.scale) / 2,
    });
  }, [canvasWidth, canvasHeight, getContainerSize, updateViewport, viewportRef]);

  return { zoomTo, zoomIn, zoomOut, zoomToFit, centerCanvas };
}
