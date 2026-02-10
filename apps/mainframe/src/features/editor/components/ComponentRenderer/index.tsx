import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { ComponentSchema, ToolMode } from '@/types/schema';
import type { EventBinding, EventTrigger } from '@/types/schema';
import { getComponent, ComponentLibrary } from '@/registry/index';
import useCanvasStore from '@/store/canvasStore';
import { Z_SELECTED_LIFT } from '@/constants/zIndex';
import useDrag from './useDrag';
import ResizeHandles from '../ResizeHandles';
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

  const componentInfo = schema.isGroup ? null : getComponent(library, schema.type);

  // 双击编辑文本
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  const textPropKey = useMemo(() => {
    if (schema.props?.children && typeof schema.props.children === 'string') return 'children';
    if (schema.props?.title && typeof schema.props.title === 'string') return 'title';
    if (schema.props?.placeholder && typeof schema.props.placeholder === 'string') return 'placeholder';
    return null;
  }, [schema.props]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || schema.editor?.locked || !textPropKey) return;
    e.stopPropagation();
    e.preventDefault();
    setEditText(schema.props[textPropKey] || '');
    setIsInlineEditing(true);
  }, [isEditMode, schema.editor?.locked, schema.props, textPropKey]);

  const commitInlineEdit = useCallback(() => {
    if (textPropKey && editText !== schema.props[textPropKey]) {
      onUpdate?.(schema.id, { props: { ...schema.props, [textPropKey]: editText } });
    }
    setIsInlineEditing(false);
  }, [textPropKey, editText, schema.id, schema.props, onUpdate]);

  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [isInlineEditing]);

  const bounds = useMemo(() => {
    if (!canvasSize) return undefined;
    const w = (schema.style?.width as number) || 100;
    const h = (schema.style?.height as number) || 40;
    return { minX: 0, minY: 0, maxX: canvasSize.width - w, maxY: canvasSize.height - h };
  }, [canvasSize, schema.style?.width, schema.style?.height]);

  const { dragProps } = useDrag({
    componentId: schema.id,
    initialPosition: { x: schema.style?.left || 0, y: schema.style?.top || 0 },
    enabled: isEditMode && !schema.editor?.locked,
    scale,
    bounds,
    onDragEnd: (pos, delta, altKey) => {
      if (altKey && delta && (delta.x !== 0 || delta.y !== 0)) {
        useCanvasStore.getState().duplicateAtPosition(
          selectedComponents.includes(schema.id) ? selectedComponents : [schema.id],
          delta.x, delta.y
        );
      } else {
        onUpdate?.(schema.id, { style: { ...schema.style, left: Math.round(pos.x), top: Math.round(pos.y) } });
      }
    },
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect?.(schema.id, e.shiftKey);
    }
  }, [isEditMode, schema.id, onSelect]);

  // 分离定位样式（wrapper 用）和组件样式（物料组件用）
  const { wrapperStyle, componentStyle } = useMemo(() => {
    const base = schema.style || {};
    const {
      position, left, top, zIndex,
      width, height, backgroundColor, borderRadius, opacity: styleOpacity,
      ...otherStyles
    } = base;

    const useSchemaPos = isSelected && isMultiSelect;
    const posLeft = useSchemaPos ? ((left as number) || 0) + (dragOffset?.x || 0) : undefined;
    const posTop = useSchemaPos ? ((top as number) || 0) + (dragOffset?.y || 0) : undefined;

    const wrapper: React.CSSProperties = {
      position: position || 'absolute',
      left, top,
      width, height,
      ...(isEditMode ? dragProps.style : {}),
      ...(useSchemaPos ? { left: `${posLeft}px`, top: `${posTop}px` } : {}),
      opacity: isEditMode && schema.editor?.visible === false ? 0.5 : 1,
      pointerEvents: isEditMode && schema.editor?.locked ? 'none' : 'auto',
      zIndex: isSelected ? ((zIndex as number) || 0) + Z_SELECTED_LIFT : zIndex,
      ...(!isEditMode && schema.editor?.visible === false ? { display: 'none' } : {}),
    };

    const comp: React.CSSProperties = {
      width: '100%', height: '100%', backgroundColor, borderRadius,
      ...(typeof styleOpacity === 'number' ? { opacity: styleOpacity } : {}),
      ...otherStyles,
    };

    return { wrapperStyle: wrapper, componentStyle: comp };
  }, [schema.style, schema.editor, isEditMode, isSelected, isMultiSelect, dragOffset, dragProps.style]);

  const canDrag = isEditMode && toolMode !== ToolMode.HAND;
  const canResize = isEditMode && isSelected && !isMultiSelect && !schema.editor?.locked && toolMode !== ToolMode.HAND;
  const wrapperClassName = isEditMode
    ? `component-wrapper ${isSelected ? (isMultiSelect ? 'multi-selected' : 'selected') : ''} ${schema.editor?.locked ? 'locked' : ''}`
    : 'component-wrapper preview';

  const handleResizeEnd = useCallback((rect: { left: number; top: number; width: number; height: number }) => {
    const currentLeft = (schema.style?.left as number) ?? 0;
    const currentTop = (schema.style?.top as number) ?? 0;
    onUpdate?.(schema.id, {
      style: {
        ...schema.style,
        left: Math.round(currentLeft + rect.left),
        top: Math.round(currentTop + rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    });
  }, [schema.id, schema.style, onUpdate]);

  // Group 容器：渲染子组件
  if (schema.isGroup) {
    return (
      <div
        onMouseDown={canDrag ? dragProps.onMouseDown : undefined}
        onClick={handleClick}
        style={wrapperStyle}
        className={wrapperClassName}
        data-component-id={schema.id}
        data-component-type="Group"
        data-component-library={library}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {schema.children?.map((child) => (
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
          ))}
        </div>
        {canResize && (
          <ResizeHandles
            style={{
              width: schema.style?.width as number,
              height: schema.style?.height as number,
            }}
            scale={scale}
            onResizeEnd={handleResizeEnd}
          />
        )}
      </div>
    );
  }

  if (!componentInfo) {
    return <div className="component-error" style={schema.style}>组件 {schema.type} 未找到</div>;
  }

  const { component: Component, meta } = componentInfo;

  // === 事件执行 ===
  const executeEvent = useCallback((trigger: EventTrigger) => {
    const bindings = schema.events?.filter(e => e.trigger === trigger) || [];
    bindings.forEach((binding: EventBinding) => {
      try {
        switch (binding.actionType) {
          case 'navigate':
          case 'openUrl': {
            const url = (binding.config as any).url;
            if (url) {
              if ((binding.config as any).newWindow) {
                window.open(url, '_blank');
              } else {
                window.location.href = url;
              }
            }
            break;
          }
          case 'showMessage': {
            const cfg = binding.config as any;
            const msgType = cfg.type || 'info';
            const content = cfg.content || '';
            const duration = (cfg.duration || 3000) / 1000;
            (message as any)[msgType]?.({ content, duration });
            break;
          }
          case 'custom': {
            const code = (binding.config as any).code;
            if (code) {
              // eslint-disable-next-line no-new-func
              new Function(code)();
            }
            break;
          }
          // setState / callApi 需要全局状态系统支持，此处暂时 log
          default:
            console.log('[Event]', binding.actionType, binding.config);
        }
      } catch (err) {
        console.error('[Event Error]', err);
      }
    });
  }, [schema.events]);

  const eventHandlers = useMemo(() => {
    if (!schema.events?.length || mode !== 'preview') return {};
    const handlers: Record<string, (e?: any) => void> = {};
    const triggers = new Set(schema.events.map(e => e.trigger));
    triggers.forEach(trigger => {
      handlers[trigger] = () => executeEvent(trigger);
    });
    return handlers;
  }, [schema.events, mode, executeEvent]);

  const { children: propsChildren, style: propsStyle, ...restProps } = { ...meta.defaultProps, ...schema.props };

  const mergedComponentStyle = { ...propsStyle, ...componentStyle };

  const children = schema.children?.length
    ? schema.children.map((child) => (
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
      ))
    : propsChildren;

  return (
    <div
      onMouseDown={canDrag ? dragProps.onMouseDown : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={wrapperStyle}
      className={wrapperClassName}
      data-component-id={schema.id}
      data-component-type={schema.type}
      data-component-library={library}
    >
      <Component {...restProps} {...eventHandlers} style={mergedComponentStyle}>{children}</Component>
      {isInlineEditing && (
        <textarea
          ref={inlineInputRef}
          className="component-inline-editor"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitInlineEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitInlineEdit(); }
            if (e.key === 'Escape') { setIsInlineEditing(false); }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}
      {canResize && (
        <ResizeHandles
          style={{
            width: schema.style?.width as number,
            height: schema.style?.height as number,
          }}
          scale={scale}
          onResizeEnd={handleResizeEnd}
        />
      )}
    </div>
  );
});

ComponentRenderer.displayName = 'ComponentRenderer';

export default ComponentRenderer;
