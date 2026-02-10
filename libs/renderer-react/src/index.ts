// 渲染器
export { ReactRenderer, createReactRenderer } from './renderer';
export type { ReactRendererConfig } from './renderer';

// 注册表
export { ReactComponentRegistry, createReactRegistry } from './registry';

// Hooks
export {
  RendererProvider,
  useRenderer,
  useRenderCanvas,
  useRenderComponent,
} from './hooks';
export type { RendererProviderProps } from './hooks';

// 组件
export { CanvasRenderer, ComponentRenderer } from './components';
export type { CanvasRendererProps, ComponentRendererProps } from './components';

// 重导出 core 类型
export type {
  ComponentMapping,
  ComponentMetadata,
  IComponentRegistry,
  RenderContext,
  EventActionHandler,
  ResolvedProps,
  ComponentSchema,
  CanvasSchema,
} from '@mlc/renderer-core';
