import React, { useMemo } from 'react';
import type { CanvasSchema, ComponentSchema } from '@mlc/schema';
import type { IComponentRegistry, EventActionHandler } from '@mlc/renderer-core';
import { RendererProvider, useRenderer, useRenderCanvas } from './hooks';
import { ReactRendererConfig } from './renderer';

/**
 * 画布渲染组件 Props
 */
export interface CanvasRendererProps {
  schema: CanvasSchema;
  registry: IComponentRegistry;
  mode?: 'edit' | 'preview' | 'runtime';
  eventHandlers?: EventActionHandler[];
  globalValues?: Record<string, any>;
  pageValues?: Record<string, any>;
  dataSourceValues?: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
  ErrorBoundary?: ReactRendererConfig['ErrorBoundary'];
  NotFoundPlaceholder?: ReactRendererConfig['NotFoundPlaceholder'];
}

/**
 * 内部画布渲染
 */
function CanvasRendererInner({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { renderer, schema } = useRenderer();

  const content = useMemo(() => {
    if (!renderer || !schema) return null;
    return renderer.renderCanvas();
  }, [renderer, schema]);

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

/**
 * 画布渲染组件
 */
export function CanvasRenderer({
  schema,
  registry,
  mode = 'preview',
  eventHandlers,
  globalValues,
  pageValues,
  dataSourceValues,
  className,
  style,
  ErrorBoundary,
  NotFoundPlaceholder,
}: CanvasRendererProps) {
  return (
    <RendererProvider
      registry={registry}
      schema={schema}
      mode={mode}
      eventHandlers={eventHandlers}
      globalValues={globalValues}
      pageValues={pageValues}
      dataSourceValues={dataSourceValues}
      ErrorBoundary={ErrorBoundary}
      NotFoundPlaceholder={NotFoundPlaceholder}
    >
      <CanvasRendererInner className={className} style={style} />
    </RendererProvider>
  );
}

/**
 * 组件渲染器 Props
 */
export interface ComponentRendererProps {
  component: ComponentSchema;
  registry: IComponentRegistry;
  mode?: 'edit' | 'preview' | 'runtime';
  eventHandlers?: EventActionHandler[];
  globalValues?: Record<string, any>;
  pageValues?: Record<string, any>;
  dataSourceValues?: Record<string, any>;
}

/**
 * 内部组件渲染
 */
function ComponentRendererInner({ component }: { component: ComponentSchema }) {
  const { renderer } = useRenderer();

  const content = useMemo(() => {
    if (!renderer) return null;
    return renderer.render(component);
  }, [renderer, component]);

  return <>{content}</>;
}

/**
 * 单组件渲染器
 */
export function ComponentRenderer({
  component,
  registry,
  mode = 'preview',
  eventHandlers,
  globalValues,
  pageValues,
  dataSourceValues,
}: ComponentRendererProps) {
  // 创建一个临时画布 schema
  const schema: CanvasSchema = useMemo(
    () => ({
      id: 'temp-canvas',
      name: 'Temp Canvas',
      width: 0,
      height: 0,
      components: [component],
    }),
    [component]
  );

  return (
    <RendererProvider
      registry={registry}
      schema={schema}
      mode={mode}
      eventHandlers={eventHandlers}
      globalValues={globalValues}
      pageValues={pageValues}
      dataSourceValues={dataSourceValues}
    >
      <ComponentRendererInner component={component} />
    </RendererProvider>
  );
}
