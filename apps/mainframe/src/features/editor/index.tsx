import React, { useCallback, useRef, useState } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { generateId } from '@mlc/utils';
import { getComponent } from '@/registry/index';
import { ToolMode } from '@/types/schema';
import { Canvas, CanvasRef, ComponentRenderer, Toolbar, CanvasSelection, SelectionBounds } from './components';
import { isJustFinishedSelection } from './components/CanvasSelection';
import './index.scss';

const Editor = () => {
  const { 
    canvas,
    addComponent,
    updateComponent,
    selectComponent,
    toolMode,
    setToolMode
  } = useCanvasStore();
  
  const canvasRef = useRef<CanvasRef>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const [viewportState, setViewportState] = useState({ scale: 1 });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isJustFinishedSelection()) {
      selectComponent(null);
    }
  }, [selectComponent]);

  const handleSelect = useCallback((id: string, multiSelect?: boolean) => selectComponent(id, multiSelect), [selectComponent]);

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

    // 拖拽时如果是抓手模式，拖拽完成后自动切换到鼠标模式
    if (toolMode === ToolMode.HAND) {
      setToolMode(ToolMode.MOUSE);
    }
  }, [addComponent, selectComponent, canvas, toolMode, setToolMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleViewportChange = useCallback(() => {
    if (!canvasRef.current) return;
    setViewportState({
      scale: canvasRef.current.getViewport().scale,
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
        toolMode={toolMode}
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
              toolMode={toolMode}
            />
          ))}
          {/* 简单处理：抓手模式下增加覆盖层，阻止事件响应 */}
          {toolMode === ToolMode.HAND && (<div className="canvas-hand-overlay"/>)}
          <CanvasSelection
            screenToCanvas={(x, y) => canvasRef.current?.screenToCanvas(x, y) ?? { x: 0, y: 0 }}
            canvasContainerRef={canvasContainerRef}
            toolMode={toolMode}
            scale={viewportState.scale}
          />
          <SelectionBounds 
            components={canvas.components} 
            scale={viewportState.scale}
            canvasSize={{ width: canvas.width, height: canvas.height }}
          />
        </div>
      </Canvas>
      
      <Toolbar
        canvasRef={canvasRef}
        scale={viewportState.scale}
        toolMode={toolMode}
        setToolMode={setToolMode}
      />
    </div>
  );
};

export default Editor;
