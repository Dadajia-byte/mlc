import React, { useCallback, useRef, useState } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { generateId } from '@mlc/utils';
import { getComponent } from '@/registry/index';
import { ToolMode } from '@/types/schema';
import { Canvas, CanvasRef, ComponentRenderer, Toolbar, CanvasSelection } from './components';
import './index.scss';

const Editor = () => {
  const { canvas, addComponent, updateComponent, selectComponent } = useCanvasStore();
  
  const canvasRef = useRef<CanvasRef>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [viewportState, setViewportState] = useState({ scale: 1, toolMode: ToolMode.MOUSE });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  }, [selectComponent]);

  const handleSelect = useCallback((id: string) => selectComponent(id), [selectComponent]);

  const handleUpdate = useCallback(
    (id: string, updates: any) => updateComponent(id, updates),
    [updateComponent]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const componentLibrary = e.dataTransfer.getData('componentLibrary') || 'antd';
    if (!componentType || !canvas) return;

    const componentInfo = getComponent(componentLibrary as any, componentType);
    if (!componentInfo) return;

    const pos = canvasRef.current?.screenToCanvas(e.clientX, e.clientY) ?? { x: 0, y: 0 };

    const newComponent = {
      id: generateId('comp_'),
      type: componentType,
      library: componentLibrary as any,
      props: { ...componentInfo.meta.defaultProps },
      children: [],
      style: {
        position: 'absolute' as const,
        left: pos.x,
        top: pos.y,
      },
      editor: { selected: true },
    };

    addComponent(newComponent);
    selectComponent(newComponent.id);
  }, [addComponent, selectComponent, canvas]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleViewportChange = useCallback(() => {
    if (!canvasRef.current) return;
    setViewportState({
      scale: canvasRef.current.getViewport().scale,
      toolMode: canvasRef.current.getToolMode(),
    });
  }, []);

  if (!canvas) return null;

  return (
    <div className="editor">
      <Canvas
        ref={canvasRef}
        canvasWidth={canvas.width}
        canvasHeight={canvas.height}
        minScale={0.3}
        maxScale={3}
        onViewportChange={handleViewportChange}
      >
        <div
          ref={canvasContainerRef}
          className="canvas"
          onClick={handleCanvasClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          {canvas.components.map((component) => (
            <ComponentRenderer
              key={component.id}
              schema={component}
              mode="edit"
              onSelect={handleSelect}
              onUpdate={handleUpdate}
              scale={viewportState.scale}
              canvasSize={{ width: canvas.width, height: canvas.height }}
            />
          ))}
          <CanvasSelection
            screenToCanvas={(x, y) => canvasRef.current?.screenToCanvas(x, y) ?? { x: 0, y: 0 }}
            canvasContainerRef={canvasContainerRef}
            toolMode={viewportState.toolMode}
          />
        </div>
      </Canvas>
      
      <Toolbar
        canvasRef={canvasRef}
        scale={viewportState.scale}
        toolMode={viewportState.toolMode}
      />
    </div>
  );
};

export default Editor;
