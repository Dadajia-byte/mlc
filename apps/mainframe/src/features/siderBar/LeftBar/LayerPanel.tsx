import React, { useCallback, useState, useRef } from 'react';
import useCanvasStore from '@/store/canvasStore';
import type { ComponentSchema } from '@/types/schema';
import { Eye, EyeOff, Lock, Unlock, Trash2, Group, Ungroup, GripVertical } from 'lucide-react';
import './LayerPanel.scss';

const LayerPanel: React.FC = () => {
  const {
    canvas,
    selectedComponents,
    selectComponent,
    setSelectedComponents,
    updateComponent,
    deleteComponent,
    groupComponents,
    ungroupComponents,
    reorderComponent,
  } = useCanvasStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(id, e.shiftKey || e.metaKey || e.ctrlKey);
  }, [selectComponent]);

  const handleToggleLock = useCallback((id: string, comp: ComponentSchema, e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponent(id, { editor: { ...comp.editor, locked: !comp.editor?.locked } });
  }, [updateComponent]);

  const handleToggleVisible = useCallback((id: string, comp: ComponentSchema, e: React.MouseEvent) => {
    e.stopPropagation();
    updateComponent(id, { editor: { ...comp.editor, visible: comp.editor?.visible === false ? true : false } });
  }, [updateComponent]);

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteComponent(id);
  }, [deleteComponent]);

  const handleDeselectAll = useCallback(() => {
    setSelectedComponents([]);
  }, [setSelectedComponents]);

  // 拖拽排序处理（图层面板是反序展示，所以需要转换索引）
  const handleDragStart = useCallback((e: React.DragEvent, reversedIdx: number) => {
    e.stopPropagation();
    setDragIndex(reversedIdx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(reversedIdx));
    if (e.currentTarget instanceof HTMLElement) {
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      requestAnimationFrame(() => {
        if (dragNodeRef.current) dragNodeRef.current.classList.add('layer-item-dragging');
      });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, reversedIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(reversedIdx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.classList.remove('layer-item-dragging');
    dragNodeRef.current = null;
    if (canvas && dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      // 图层面板展示是 reversed 顺序，转换回真实索引
      const total = canvas.components.length;
      const realFrom = total - 1 - dragIndex;
      const realTo = total - 1 - dropIndex;
      reorderComponent(realFrom, realTo);
    }
    setDragIndex(null);
    setDropIndex(null);
  }, [canvas, dragIndex, dropIndex, reorderComponent]);

  if (!canvas) return <div className="layer-panel-empty">暂无画布</div>;

  const components = [...canvas.components].reverse();

  return (
    <div className="layer-panel" onClick={handleDeselectAll}>
      <div className="layer-panel-header">
        <span className="layer-panel-header-title">图层列表</span>
        <span className="layer-panel-header-count">{canvas.components.length}</span>
      </div>
      <div className="layer-panel-actions">
        <button
          className="layer-panel-action-btn"
          disabled={selectedComponents.length < 2}
          onClick={groupComponents}
          title="编组 ⌘G"
        >
          <Group size={14} />
        </button>
        <button
          className="layer-panel-action-btn"
          disabled={selectedComponents.length !== 1 || !canvas.components.find(c => c.id === selectedComponents[0])?.isGroup}
          onClick={ungroupComponents}
          title="取消编组 ⌘⇧G"
        >
          <Ungroup size={14} />
        </button>
      </div>
      <div className="layer-panel-list">
        {components.length === 0 ? (
          <div className="layer-panel-empty">拖入组件以开始设计</div>
        ) : (
          components.map((comp, idx) => {
            const isSelected = selectedComponents.includes(comp.id);
            const isLocked = !!comp.editor?.locked;
            const isHidden = comp.editor?.visible === false;
            const isDragOver = dropIndex === idx && dragIndex !== idx;

            return (
              <div
                key={comp.id}
                className={`layer-item ${isSelected ? 'layer-item-selected' : ''} ${isHidden ? 'layer-item-hidden' : ''} ${isDragOver ? 'layer-item-drop-target' : ''}`}
                onClick={(e) => handleSelect(comp.id, e)}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <div className="layer-item-drag-handle" onMouseDown={(e) => e.stopPropagation()}>
                  <GripVertical size={12} />
                </div>
                <div className="layer-item-info">
                  <span className="layer-item-type">{comp.isGroup ? `Group (${comp.children?.length || 0})` : comp.type}</span>
                  <span className="layer-item-id">{comp.id.slice(-6)}</span>
                </div>
                <div className="layer-item-actions">
                  <button
                    className={`layer-item-btn ${isHidden ? 'active' : ''}`}
                    onClick={(e) => handleToggleVisible(comp.id, comp, e)}
                    title={isHidden ? '显示' : '隐藏'}
                  >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className={`layer-item-btn ${isLocked ? 'active' : ''}`}
                    onClick={(e) => handleToggleLock(comp.id, comp, e)}
                    title={isLocked ? '解锁' : '锁定'}
                  >
                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    className="layer-item-btn danger"
                    onClick={(e) => handleDelete(comp.id, e)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
