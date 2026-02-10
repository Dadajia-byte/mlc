import type { ComponentSchema, CanvasSchema } from '@mlc/schema';

/**
 * 组件映射协议 - 框架无关的组件接口
 */
export interface ComponentMapping {
  /** 组件类型标识 */
  type: string;
  /** 组件所属库 */
  library: string;
  /** 组件实现（具体类型由各框架渲染器定义） */
  component: any;
  /** 组件元数据（用于编辑器） */
  meta?: ComponentMetadata;
}

/**
 * 组件元数据 - 纯数据，框架无关
 */
export interface ComponentMetadata {
  name: string;
  title: string;
  category: string;
  description?: string;
  thumbnail?: string;
  defaultProps?: Record<string, any>;
  defaultStyle?: Record<string, any>;
  propConfig?: Record<string, any>;
  supportedEvents?: Array<{
    trigger: string;
    label: string;
    description?: string;
  }>;
}

/**
 * 组件注册表接口 - 各渲染器需实现
 */
export interface IComponentRegistry {
  /** 注册组件 */
  register(mapping: ComponentMapping): void;
  /** 获取组件 */
  get(library: string, type: string): ComponentMapping | undefined;
  /** 获取所有组件 */
  getAll(): ComponentMapping[];
  /** 按库获取组件 */
  getByLibrary(library: string): ComponentMapping[];
}

/**
 * 渲染上下文 - 传递给组件的运行时数据
 */
export interface RenderContext {
  /** 当前模式 */
  mode: 'edit' | 'preview' | 'runtime';
  /** 画布 Schema */
  canvas?: CanvasSchema;
  /** 全局变量值 */
  globalValues?: Record<string, any>;
  /** 页面变量值 */
  pageValues?: Record<string, any>;
  /** 数据源值 */
  dataSourceValues?: Record<string, any>;
  /** 组件变量值 */
  componentValues?: Record<string, Record<string, any>>;
  /** 系统变量 */
  system?: {
    now: Date;
    location: typeof window.location;
    userAgent: string;
  };
}

/**
 * 事件动作处理器
 */
export interface EventActionHandler {
  type: string;
  execute: (config: any, context: EventExecutionContext) => void | Promise<void>;
}

/**
 * 事件执行上下文
 */
export interface EventExecutionContext {
  /** 触发事件的组件 Schema */
  component: ComponentSchema;
  /** 原生事件对象 */
  nativeEvent?: any;
  /** 渲染上下文 */
  renderContext: RenderContext;
  /** 更新变量 */
  setVariable?: (scope: 'global' | 'page' | 'component', name: string, value: any) => void;
  /** 刷新数据源 */
  refreshDataSource?: (name: string) => Promise<void>;
}

/**
 * 渲染器配置
 */
export interface RendererConfig {
  /** 组件注册表 */
  registry: IComponentRegistry;
  /** 事件动作处理器 */
  eventHandlers?: EventActionHandler[];
  /** 默认模式 */
  defaultMode?: 'edit' | 'preview' | 'runtime';
}

/**
 * Schema 遍历回调
 */
export interface SchemaVisitor {
  enter?: (schema: ComponentSchema, parent?: ComponentSchema) => void;
  leave?: (schema: ComponentSchema, parent?: ComponentSchema) => void;
}

/**
 * 解析后的组件属性
 */
export interface ResolvedProps {
  /** 静态属性 */
  staticProps: Record<string, any>;
  /** 绑定属性（已求值） */
  boundProps: Record<string, any>;
  /** 事件处理器 */
  eventHandlers: Record<string, (...args: any[]) => void>;
  /** 合并后的最终属性 */
  mergedProps: Record<string, any>;
}
