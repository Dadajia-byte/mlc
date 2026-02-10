// 渲染器
export { VueRenderer, createVueRenderer } from './renderer';
export type { VueRendererConfig } from './renderer';

// 注册表
export { VueComponentRegistry, createVueRegistry } from './registry';

// 组件
export {
  RendererProvider,
  CanvasRenderer,
  ComponentRenderer,
  useRenderer,
} from './components';

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
