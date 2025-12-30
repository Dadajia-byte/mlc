import React, { useMemo, useCallback } from 'react';
import { ComponentSchema, ToolMode } from '@/types/schema';
import { getComponent, ComponentLibrary } from '@/registry/index';
import useCanvasStore from '@/store/canvasStore';
import useDrag from './useDrag';
import './index.scss';

interface ComponentRendererProps {
  schema: ComponentSchema;
  mode?: 'edit' | 'preview';
  onSelect?: (id: string) => void;
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
  const { selectedComponents } = useCanvasStore();
  const isEditMode = mode === 'edit';
  const isSelected = selectedComponents.includes(schema.id);
  const library: ComponentLibrary = schema.library || 'antd';

  const componentInfo = getComponent(library, schema.type);
  if (!componentInfo) {
    console.warn(`Component ${schema.type} not found in library ${library}`);
    return (
      <div className="component-error" style={schema.style}>
        组件 {schema.type} 未找到
      </div>
    );
  }

  const { component: Component, meta } = componentInfo;

  // 计算边界限制
  const bounds = useMemo(() => {
    if (!canvasSize) return undefined;
    const componentWidth = (schema.style?.width as number) || 100;
    const componentHeight = (schema.style?.height as number) || 40;
    return {
      minX: 0,
      minY: 0,
      maxX: canvasSize.width - componentWidth,
      maxY: canvasSize.height - componentHeight,
    };
  }, [canvasSize, schema.style?.width, schema.style?.height]);

  // 拖拽功能
  const { dragProps } = useDrag({
    initialPosition: {
      x: schema.style?.left || 0,
      y: schema.style?.top || 0,
    },
    enabled: isEditMode && !schema.editor?.locked,
    scale,
    bounds,
    onDragEnd: (position) => {
      onUpdate?.(schema.id, {
        style: { ...schema.style, left: position.x, top: position.y },
      });
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect?.(schema.id);
    }
  }, [isEditMode, schema.id, onSelect]);

  const mergedStyle = useMemo(() => {
    const baseStyle = schema.style || {};
    const dragStyle = isEditMode ? dragProps.style : {};
    return {
      ...baseStyle,
      ...dragStyle,
      opacity: schema.editor?.visible === false ? 0.5 : 1,
      pointerEvents: (schema.editor?.locked ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
      zIndex: isSelected ? (baseStyle.zIndex || 0) + 1000 : baseStyle.zIndex,
    };
  }, [schema.style, schema.editor, isEditMode, isSelected, dragProps.style]);

  const { children: propsChildren, ...restProps } = useMemo(() => ({
    ...meta.defaultProps,
    ...schema.props,
  }), [meta.defaultProps, schema.props]);

  const renderChildren = useMemo(() => {
    if (schema.children && schema.children.length > 0) {
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

  return (
    <div
      onMouseDown={isEditMode && toolMode !== ToolMode.HAND ? dragProps.onMouseDown : undefined} // 编辑模式且画布不处于抓手状态
      onClick={handleClick}
      style={mergedStyle}
      className={`component-wrapper ${isSelected ? 'selected' : ''} ${schema.editor?.locked ? 'locked' : ''}`}
      data-component-id={schema.id}
      data-component-type={schema.type}
      data-component-library={library}
    >
      <Component {...restProps}>
        {renderChildren}
      </Component>
    </div>
  );
}, (prevProps, nextProps) => (
  prevProps.schema.id === nextProps.schema.id &&
  prevProps.schema === nextProps.schema &&
  prevProps.mode === nextProps.mode &&
  prevProps.scale === nextProps.scale &&
  prevProps.canvasSize === nextProps.canvasSize
));

ComponentRenderer.displayName = 'ComponentRenderer';

export default ComponentRenderer;
