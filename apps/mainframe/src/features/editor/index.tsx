import React, { useCallback, useRef, useState, useMemo } from 'react';
import useCanvasStore from '@/store/canvasStore';
import { generateId } from '@mlc/utils';
import { getComponent } from '@/registry/index';
import { ToolMode } from '@/types/schema';
import { ContextMenu, MenuItem } from '@/components';
import { Canvas, CanvasRef, ComponentRenderer, CanvasSelection, SelectionBounds, Guidelines } from './components';
import { isJustFinishedSelection } from './components/CanvasSelection';
import './index.scss';

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  targetComponentId: string | null;
}

interface EditorProps {
  canvasRef: React.RefObject<CanvasRef>;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  onViewportChange: () => void;
  isPreview?: boolean;
}

const Editor = ({ canvasRef, toolMode, setToolMode, onViewportChange, isPreview = false }: EditorProps) => {
  const { 
    canvas,
    addComponent,
    updateComponent,
    selectComponent,
    selectedComponents,
    clipboard,
    copySelectedComponents,
    cutSelectedComponents,
    pasteComponents,
    deleteSelectedComponents,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    guidelines,
    alignComponents,
    distributeComponents,
    groupComponents,
    ungroupComponents,
  } = useCanvasStore();
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [viewportState, setViewportState] = useState({ scale: 1 });

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    canvasPosition: { x: 0, y: 0 },
    targetComponentId: null,
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isJustFinishedSelection()) {
      selectComponent(null);
    }
  }, [selectComponent]);

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvasPos = canvasRef.current?.screenToCanvas(e.clientX, e.clientY) ?? { x: 0, y: 0 };
    const target = e.target as HTMLElement;
    const componentWrapper = target.closest('[data-component-id]');
    const componentId = componentWrapper?.getAttribute('data-component-id') || null;
    
    if (componentId && !selectedComponents.includes(componentId)) {
      selectComponent(componentId, false);
    }
    
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      canvasPosition: canvasPos,
      targetComponentId: componentId,
    });
  }, [selectComponent, selectedComponents, canvasRef]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleContextMenuClick = useCallback((key: string) => {
    const { canvasPosition, targetComponentId } = contextMenu;
    const componentId = targetComponentId || selectedComponents[0];
    
    switch (key) {
      case 'copy': copySelectedComponents(); break;
      case 'cut': cutSelectedComponents(); break;
      case 'paste': pasteComponents(canvasPosition); break;
      case 'delete': deleteSelectedComponents(); break;
      case 'selectAll':
        if (canvas) useCanvasStore.getState().setSelectedComponents(canvas.components.map(c => c.id));
        break;
      case 'lock':
      case 'unlock': {
        if (componentId) {
          const comp = canvas?.components.find(c => c.id === componentId);
          updateComponent(componentId, { editor: { ...comp?.editor, locked: key === 'lock' } });
        }
        break;
      }
      case 'show':
      case 'hide': {
        if (componentId) {
          const comp = canvas?.components.find(c => c.id === componentId);
          updateComponent(componentId, { editor: { ...comp?.editor, visible: key === 'show' } });
        }
        break;
      }
      case 'bringToFront': if (componentId) bringToFront(componentId); break;
      case 'sendToBack': if (componentId) sendToBack(componentId); break;
      case 'bringForward': if (componentId) bringForward(componentId); break;
      case 'sendBackward': if (componentId) sendBackward(componentId); break;
      case 'alignLeft': alignComponents('left'); break;
      case 'alignRight': alignComponents('right'); break;
      case 'alignTop': alignComponents('top'); break;
      case 'alignBottom': alignComponents('bottom'); break;
      case 'alignHCenter': alignComponents('horizontalCenter'); break;
      case 'alignVCenter': alignComponents('verticalCenter'); break;
      case 'distributeH': distributeComponents('horizontal'); break;
      case 'distributeV': distributeComponents('vertical'); break;
      case 'group': groupComponents(); break;
      case 'ungroup': ungroupComponents(); break;
    }
    handleContextMenuClose();
  }, [contextMenu, canvas, selectedComponents, copySelectedComponents, cutSelectedComponents, pasteComponents, deleteSelectedComponents, updateComponent, bringForward, sendBackward, bringToFront, sendToBack, alignComponents, distributeComponents, groupComponents, ungroupComponents, handleContextMenuClose]);

  const contextMenuItems: MenuItem[] = useMemo(() => {
    const { targetComponentId } = contextMenu;
    const hasSelection = selectedComponents.length > 0;
    const hasClipboard = clipboard.length > 0;
    const componentId = targetComponentId || selectedComponents[0];
    const targetComp = componentId ? canvas?.components.find(c => c.id === componentId) : null;
    const isLocked = targetComp?.editor?.locked;
    const isVisible = targetComp?.editor?.visible !== false;

    if (componentId) {
      const isMulti = selectedComponents.length > 1;
      const isGroup = targetComp?.isGroup === true;
      const items: MenuItem[] = [
        { key: 'copy', label: '复制', shortcut: '⌘C', disabled: !hasSelection },
        { key: 'cut', label: '剪切', shortcut: '⌘X', disabled: !hasSelection },
        { key: 'paste', label: '粘贴', shortcut: '⌘V', disabled: !hasClipboard },
        { key: 'divider1', label: '', divider: true },
        { key: 'delete', label: '删除', shortcut: '⌫', danger: true, disabled: !hasSelection },
        { key: 'divider2', label: '', divider: true },
        { key: isLocked ? 'unlock' : 'lock', label: isLocked ? '解锁' : '锁定', shortcut: '⌘L' },
        { key: isVisible ? 'hide' : 'show', label: isVisible ? '隐藏' : '显示', shortcut: '⌘H' },
        { key: 'divider3', label: '', divider: true },
        {
          key: 'layer', label: '层级',
          children: [
            { key: 'bringForward', label: '上移一层', shortcut: '⌘]' },
            { key: 'sendBackward', label: '下移一层', shortcut: '⌘[' },
            { key: 'bringToFront', label: '置于顶层', shortcut: '⌘⇧]' },
            { key: 'sendToBack', label: '置于底层', shortcut: '⌘⇧[' },
          ],
        },
      ];
      if (isMulti) {
        items.push(
          { key: 'divider4', label: '', divider: true },
          { key: 'group', label: '编组', shortcut: '⌘G' },
          { key: 'divider5', label: '', divider: true },
          {
            key: 'align', label: '对齐',
            children: [
              { key: 'alignLeft', label: '左对齐' },
              { key: 'alignHCenter', label: '水平居中' },
              { key: 'alignRight', label: '右对齐' },
              { key: 'alignTop', label: '顶部对齐' },
              { key: 'alignVCenter', label: '垂直居中' },
              { key: 'alignBottom', label: '底部对齐' },
            ],
          },
          {
            key: 'distribute', label: '分布',
            disabled: selectedComponents.length < 3,
            children: [
              { key: 'distributeH', label: '水平等间距' },
              { key: 'distributeV', label: '垂直等间距' },
            ],
          },
        );
      }
      if (!isMulti && isGroup) {
        items.push(
          { key: 'divider6', label: '', divider: true },
          { key: 'ungroup', label: '取消编组', shortcut: '⌘⇧G' },
        );
      }
      return items;
    }

    return [
      { key: 'paste', label: '粘贴', shortcut: '⌘V', disabled: !hasClipboard },
      { key: 'divider1', label: '', divider: true },
      { key: 'selectAll', label: '全选', shortcut: '⌘A', disabled: !canvas?.components.length },
    ];
  }, [contextMenu, selectedComponents, clipboard, canvas]);

  const handleSelect = useCallback((id: string, multiSelect?: boolean) => selectComponent(id, multiSelect), [selectComponent]);
  const handleUpdate = useCallback((id: string, updates: any) => updateComponent(id, updates), [updateComponent]);

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
      style: { position: 'absolute' as const, left: pos.x, top: pos.y },
      editor: { selected: true },
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    if (toolMode === ToolMode.HAND) setToolMode(ToolMode.MOUSE);
  }, [addComponent, selectComponent, canvas, toolMode, setToolMode, canvasRef]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleViewportChange = useCallback(() => {
    if (!canvasRef.current) return;
    setViewportState({ scale: canvasRef.current.getViewport().scale });
    onViewportChange();
  }, [canvasRef, onViewportChange]);

  if (!canvas) return null;

  return (
    <div className="editor" onContextMenu={(e) => e.preventDefault()}>
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
          onClick={!isPreview ? handleCanvasClick : undefined}
          onContextMenu={!isPreview ? handleCanvasContextMenu : undefined}
          onDrop={!isPreview ? handleDrop : undefined}
          onDragOver={!isPreview ? handleDragOver : undefined}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          {canvas.components.map((component) => (
            <ComponentRenderer
              key={component.id}
              schema={component}
              mode={isPreview ? 'preview' : 'edit'}
              onSelect={!isPreview ? handleSelect : undefined}
              onUpdate={!isPreview ? handleUpdate : undefined}
              scale={viewportState.scale}
              canvasSize={{ width: canvas.width, height: canvas.height }}
              toolMode={toolMode}
            />
          ))}
          {!isPreview && toolMode === ToolMode.HAND && (<div className="canvas-hand-overlay"/>)}
          {!isPreview && (
            <CanvasSelection
              screenToCanvas={(x, y) => canvasRef.current?.screenToCanvas(x, y) ?? { x: 0, y: 0 }}
              canvasContainerRef={canvasContainerRef}
              toolMode={toolMode}
              scale={viewportState.scale}
            />
          )}
          {!isPreview && (
            <SelectionBounds 
              components={canvas.components} 
              scale={viewportState.scale}
              canvasSize={{ width: canvas.width, height: canvas.height }}
            />
          )}
          {!isPreview && (
            <Guidelines
              guidelines={guidelines}
              canvasWidth={canvas.width}
              canvasHeight={canvas.height}
            />
          )}
        </div>
      </Canvas>

      {!isPreview && (
        <ContextMenu
          items={contextMenuItems}
          visible={contextMenu.visible}
          position={contextMenu.position}
          onClose={handleContextMenuClose}
          onClick={handleContextMenuClick}
        />
      )}
    </div>
  );
};

export default Editor;
