// 类型导出
export type {
  ComponentMapping,
  ComponentMetadata,
  IComponentRegistry,
  RenderContext,
  EventActionHandler,
  EventExecutionContext,
  RendererConfig,
  SchemaVisitor,
  ResolvedProps,
} from './types';

// Schema 解析器
export { SchemaParser, createSchemaParser } from './schema-parser';

// 事件引擎
export { EventEngine, createEventEngine } from './event-engine';

// 数据绑定运行时
export { BindingRuntime, createBindingRuntime } from './binding-runtime';

// 组件注册表
export { ComponentRegistry, createComponentRegistry } from './component-registry';

// 渲染器基类
export { BaseRenderer } from './renderer-base';
export type { BaseRendererConfig } from './renderer-base';

// 重导出 @mlc/schema 常用类型（方便消费方）
export type {
  ComponentSchema,
  CanvasSchema,
  EventBinding,
  EventTrigger,
  PropertyBinding,
  ComponentBindings,
  VariableDefinition,
  DataSourceDefinition,
} from '@mlc/schema';
