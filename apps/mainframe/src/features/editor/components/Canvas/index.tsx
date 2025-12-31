import React, { forwardRef, useImperativeHandle } from 'react';
import useCanvas, { CanvasConfig } from './useCanvas';
import { ViewportState } from './useViewport';
import { ToolMode } from '@/types/schema';
import './index.scss';

export interface CanvasProps extends Omit<CanvasConfig, 'onViewportChange' | 'toolMode'> {
  children: React.ReactNode;
  className?: string;
  onViewportChange?: () => void;
  toolMode: ToolMode;
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
  config: { minScale: number; maxScale: number; scaleStep: number };
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(
  ({ children, className, onViewportChange, toolMode, ...config }, ref) => {
    const {
      viewport,
      toolMode: currentToolMode,
      containerRef,
      containerProps,
      canvasStyle,
      zoomIn,
      zoomOut,
      zoomTo,
      zoomToFit,
      centerCanvas,
      screenToCanvas,
      canvasToScreen,
      config: canvasConfig,
    } = useCanvas({ ...config, onViewportChange, toolMode });

    useImperativeHandle(ref, () => ({
      zoomIn,
      zoomOut,
      zoomTo,
      zoomToFit,
      centerCanvas,
      screenToCanvas,
      canvasToScreen,
      getViewport: () => viewport,
      getToolMode: () => currentToolMode,
      config: canvasConfig,
    }), [viewport, currentToolMode, zoomIn, zoomOut, zoomTo, zoomToFit, centerCanvas, screenToCanvas, canvasToScreen, canvasConfig]);

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
