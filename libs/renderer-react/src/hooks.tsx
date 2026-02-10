import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { CanvasSchema, ComponentSchema } from '@mlc/schema';
import type { RenderContext, IComponentRegistry, EventActionHandler } from '@mlc/renderer-core';
import { ReactRenderer, createReactRenderer, ReactRendererConfig } from './renderer';

/**
 * 渲染器上下文值
 */
interface RendererContextValue {
  renderer: ReactRenderer | null;
  schema: CanvasSchema | null;
  context: RenderContext;
  setSchema: (schema: CanvasSchema) => void;
  updateContext: (partial: Partial<RenderContext>) => void;
  setMode: (mode: 'edit' | 'preview' | 'runtime') => void;
}

const RendererContext = createContext<RendererContextValue | null>(null);

/**
 * 渲染器 Provider Props
 */
export interface RendererProviderProps {
  children: ReactNode;
  registry: IComponentRegistry;
  schema?: CanvasSchema;
  mode?: 'edit' | 'preview' | 'runtime';
  eventHandlers?: EventActionHandler[];
  globalValues?: Record<string, any>;
  pageValues?: Record<string, any>;
  dataSourceValues?: Record<string, any>;
  ErrorBoundary?: ReactRendererConfig['ErrorBoundary'];
  NotFoundPlaceholder?: ReactRendererConfig['NotFoundPlaceholder'];
}

/**
 * 渲染器 Provider
 */
export function RendererProvider({
  children,
  registry,
  schema: initialSchema,
  mode = 'preview',
  eventHandlers,
  globalValues = {},
  pageValues = {},
  dataSourceValues = {},
  ErrorBoundary,
  NotFoundPlaceholder,
}: RendererProviderProps) {
  const [schema, setSchemaState] = useState<CanvasSchema | null>(initialSchema || null);

  const renderer = useMemo(() => {
    return createReactRenderer({
      registry,
      eventHandlers,
      defaultMode: mode,
      ErrorBoundary,
      NotFoundPlaceholder,
    });
  }, [registry, eventHandlers, mode, ErrorBoundary, NotFoundPlaceholder]);

  // 设置初始 schema
  useEffect(() => {
    if (schema) {
      renderer.setSchema(schema);
    }
  }, [renderer, schema]);

  // 更新上下文
  useEffect(() => {
    renderer.updateContext({
      globalValues,
      pageValues,
      dataSourceValues,
    });
  }, [renderer, globalValues, pageValues, dataSourceValues]);

  const setSchema = useCallback(
    (newSchema: CanvasSchema) => {
      setSchemaState(newSchema);
      renderer.setSchema(newSchema);
    },
    [renderer]
  );

  const updateContext = useCallback(
    (partial: Partial<RenderContext>) => {
      renderer.updateContext(partial);
    },
    [renderer]
  );

  const setMode = useCallback(
    (newMode: 'edit' | 'preview' | 'runtime') => {
      renderer.setMode(newMode);
    },
    [renderer]
  );

  const value: RendererContextValue = useMemo(
    () => ({
      renderer,
      schema,
      context: renderer.getContext(),
      setSchema,
      updateContext,
      setMode,
    }),
    [renderer, schema, setSchema, updateContext, setMode]
  );

  return React.createElement(RendererContext.Provider, { value }, children);
}

/**
 * 使用渲染器 Hook
 */
export function useRenderer(): RendererContextValue {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRenderer must be used within a RendererProvider');
  }
  return context;
}

/**
 * 渲染画布 Hook
 */
export function useRenderCanvas(): ReactNode {
  const { renderer, schema } = useRenderer();
  return useMemo(() => {
    if (!renderer || !schema) return null;
    return renderer.renderCanvas();
  }, [renderer, schema]);
}

/**
 * 渲染组件 Hook
 */
export function useRenderComponent(component: ComponentSchema): ReactNode {
  const { renderer } = useRenderer();
  return useMemo(() => {
    if (!renderer) return null;
    return renderer.render(component);
  }, [renderer, component]);
}
