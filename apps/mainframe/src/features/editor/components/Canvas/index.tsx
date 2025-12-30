import React, { forwardRef, useImperativeHandle } from 'react';
import useCanvas, { CanvasConfig, ViewportState } from './useCanvas';
import { ToolMode } from '@/types/schema';
import './index.scss';

export interface CanvasProps extends Omit<CanvasConfig, 'onViewportChange'> {
  children: React.ReactNode;
  className?: string;
  onViewportChange?: () => void;
}

export interface CanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (scale: number) => void;
  zoomToFit: () => void;
  centerCanvas: () => void;
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };
  getViewport: () => ViewportState;
  getToolMode: () => ToolMode;
  setToolMode: (mode: ToolMode) => void;
  config: { minScale: number; maxScale: number; scaleStep: number };
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(
  ({ children, className, onViewportChange, ...config }, ref) => {
    const {
      viewport,
      toolMode,
      containerRef,
      containerProps,
      canvasStyle,
      setToolMode,
      zoomIn,
      zoomOut,
      zoomTo,
      zoomToFit,
      centerCanvas,
      screenToCanvas,
      canvasToScreen,
      config: canvasConfig,
    } = useCanvas({ ...config, onViewportChange });

    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      zoomTo,
      zoomToFit,
      centerCanvas,
      screenToCanvas,
      canvasToScreen,
      getViewport: () => viewport,
      getToolMode: () => toolMode,
      setToolMode,
      config: canvasConfig,
    }), [viewport, toolMode, setToolMode, zoomIn, zoomOut, zoomTo, zoomToFit, centerCanvas, screenToCanvas, canvasToScreen, canvasConfig]);

    return (
      <div
        ref={containerRef}
        className={`canvas-container ${className || ''}`}
        {...containerProps}
      >
        <div className="canvas-container__wrapper">
          <div className="canvas-container__content" style={canvasStyle}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;
export type { ViewportState, CanvasConfig };
