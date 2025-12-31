import React, { useMemo, useCallback } from 'react';
import { ComponentSchema, ToolMode } from '@/types/schema';
import { getComponent, ComponentLibrary } from '@/registry/index';
import useCanvasStore from '@/store/canvasStore';
import useDrag from './useDrag';
import './index.scss';

interface ComponentRendererProps {
  schema: ComponentSchema;
  mode?: 'edit' | 'preview';
  onSelect?: (id: string, multiSelect?: boolean) => void;
  onUpdate?: (id: string, updates: Partial<ComponentSchema>) => void;
  scale?: number;
  canvasSize?: { width: number; height: number };
  toolMode: ToolMode;
}

const ComponentRenderer = React.memo(({
  schema,
  mode = 'edit',
  onSelect,
  onUpdate,
  scale = 1,
  canvasSize,
  toolMode,
}: ComponentRendererProps) => {
  const { selectedComponents, dragOffset } = useCanvasStore();
  const isEditMode = mode === 'edit';
  const isSelected = selectedComponents.includes(schema.id);
  const isMultiSelect = selectedComponents.length > 1;
  const library: ComponentLibrary = schema.library || 'antd';

  const componentInfo = getComponent(library, schema.type);
  if (!componentInfo) {
    return <div className="component-error" style={schema.style}>组件 {schema.type} 未找到</div>;
  }

  const { component: Component, meta } = componentInfo;

  const bounds = useMemo(() => {
    if (!canvasSize) return undefined;
    const w = (schema.style?.width as number) || 100;
    const h = (schema.style?.height as number) || 40;
    return { minX: 0, minY: 0, maxX: canvasSize.width - w, maxY: canvasSize.height - h };
  }, [canvasSize, schema.style?.width, schema.style?.height]);

  const { dragProps } = useDrag({
    initialPosition: { x: schema.style?.left || 0, y: schema.style?.top || 0 },
    enabled: isEditMode && !schema.editor?.locked,
    scale,
    bounds,
    onDragEnd: (pos) => onUpdate?.(schema.id, { style: { ...schema.style, left: pos.x, top: pos.y } }),
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect?.(schema.id, e.shiftKey);
    }
  }, [isEditMode, schema.id, onSelect]);

  const style = useMemo(() => {
    const base = schema.style || {};
    const useSchemaPos = isSelected && isMultiSelect;
    const left = useSchemaPos ? (base.left as number || 0) + (dragOffset?.x || 0) : undefined;
    const top = useSchemaPos ? (base.top as number || 0) + (dragOffset?.y || 0) : undefined;

    return {
      ...base,
      ...(isEditMode ? dragProps.style : {}),
      ...(useSchemaPos ? { left: `${left}px`, top: `${top}px` } : {}),
      opacity: schema.editor?.visible === false ? 0.5 : 1,
      pointerEvents: schema.editor?.locked ? 'none' : 'auto',
      zIndex: isSelected ? (base.zIndex || 0) + 1000 : base.zIndex,
    } as React.CSSProperties;
  }, [schema.style, schema.editor, isEditMode, isSelected, isMultiSelect, dragOffset, dragProps.style]);

  const { children: propsChildren, ...restProps } = { ...meta.defaultProps, ...schema.props };

  const children = useMemo(() => {
    if (schema.children?.length) {
      return schema.children.map((child) => (
        <ComponentRenderer
          key={child.id}
          schema={child}
          mode={mode}
          onSelect={onSelect}
          onUpdate={onUpdate}
          scale={scale}
          canvasSize={canvasSize}
          toolMode={toolMode}
        />
      ));
    }
    return propsChildren;
  }, [schema.children, propsChildren, mode, onSelect, onUpdate, scale, canvasSize, toolMode]);

  const canDrag = isEditMode && toolMode !== ToolMode.HAND;
  const className = `component-wrapper ${isSelected ? (isMultiSelect ? 'multi-selected' : 'selected') : ''} ${schema.editor?.locked ? 'locked' : ''}`;

  return (
    <div
      onMouseDown={canDrag ? dragProps.onMouseDown : undefined}
      onClick={handleClick}
      style={style}
      className={className}
      data-component-id={schema.id}
      data-component-type={schema.type}
      data-component-library={library}
    >
      <Component {...restProps}>{children}</Component>
    </div>
  );
});

ComponentRenderer.displayName = 'ComponentRenderer';

export default ComponentRenderer;
