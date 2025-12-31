import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ToolMode } from '@/types/schema';
import { Rect, getComponentsInRect } from '@/utils/geometry';
import useCanvasStore from '@/store/canvasStore';
import './index.scss';

interface CanvasSelectionProps {
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  canvasContainerRef: React.RefObject<HTMLElement>;
  toolMode: ToolMode;
  scale: number;
}

let justFinishedSelection = false;

const CanvasSelection: React.FC<CanvasSelectionProps> = ({
  screenToCanvas,
  canvasContainerRef,
  toolMode,
  scale,
}) => {
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const boxRef = useRef<Rect | null>(null);
  const scaleRef = useRef(scale);

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { boxRef.current = selectionBox; }, [selectionBox]);

  const finishSelection = useCallback(() => {
    const box = boxRef.current;
    const canvas = useCanvasStore.getState().canvas;

    if (box && canvas) {
      const ids = getComponentsInRect(canvas.components, box, scaleRef.current);
      if (ids.length > 0) {
        useCanvasStore.getState().setSelectedComponents(ids);
        justFinishedSelection = true;
        setTimeout(() => { justFinishedSelection = false; }, 0);
      } else {
        useCanvasStore.getState().selectComponent(null);
      }
    }

    startRef.current = null;
    setSelectionBox(null);
  }, []);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (toolMode !== ToolMode.MOUSE || !container) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-component-id]') || target.closest('.selection-bounds')) return;
      if (target !== container && !container.contains(target)) return;

      startRef.current = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox(null);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!startRef.current) return;
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox({
        x: Math.min(startRef.current.x, x),
        y: Math.min(startRef.current.y, y),
        width: Math.abs(x - startRef.current.x),
        height: Math.abs(y - startRef.current.y),
      });
    };

    const onMouseUp = () => {
      if (startRef.current) finishSelection();
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [toolMode, canvasContainerRef, screenToCanvas, finishSelection]);

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

export const isJustFinishedSelection = () => justFinishedSelection;

export default CanvasSelection;
