import type { ComponentSchema, CanvasSchema } from '@mlc/schema';
import type {
  RenderContext,
  IComponentRegistry,
  EventActionHandler,
  ResolvedProps,
  ComponentMapping,
} from './types';
import { SchemaParser, createSchemaParser } from './schema-parser';
import { EventEngine, createEventEngine } from './event-engine';
import { BindingRuntime, createBindingRuntime } from './binding-runtime';

/**
 * 渲染器配置
 */
export interface BaseRendererConfig {
  /** 组件注册表 */
  registry: IComponentRegistry;
  /** 自定义事件处理器 */
  eventHandlers?: EventActionHandler[];
  /** 默认模式 */
  defaultMode?: 'edit' | 'preview' | 'runtime';
}

/**
 * 渲染器基类 - 提供跨框架的公共能力
 * 各框架渲染器继承此类，实现具体的 render 方法
 */
export abstract class BaseRenderer {
  protected registry: IComponentRegistry;
  protected eventEngine: EventEngine;
  protected bindingRuntime: BindingRuntime;
  protected schemaParser: SchemaParser | null = null;
  protected context: RenderContext;

  constructor(config: BaseRendererConfig) {
    this.registry = config.registry;
    this.context = {
      mode: config.defaultMode || 'preview',
      globalValues: {},
      pageValues: {},
      dataSourceValues: {},
      componentValues: {},
    };
    this.eventEngine = createEventEngine(this.context, config.eventHandlers);
    this.bindingRuntime = createBindingRuntime(this.context);
  }

  /**
   * 设置 Schema
   */
  setSchema(schema: CanvasSchema): void {
    this.schemaParser = createSchemaParser(schema);
    this.context.canvas = schema;
    this.eventEngine.updateContext(this.context);
    this.bindingRuntime.updateContext(this.context);
  }

  /**
   * 获取 Schema 解析器
   */
  getSchemaParser(): SchemaParser | null {
    return this.schemaParser;
  }

  /**
   * 更新渲染上下文
   */
  updateContext(partial: Partial<RenderContext>): void {
    this.context = { ...this.context, ...partial };
    this.eventEngine.updateContext(this.context);
    this.bindingRuntime.updateContext(this.context);
  }

  /**
   * 获取当前上下文
   */
  getContext(): RenderContext {
    return this.context;
  }

  /**
   * 设置渲染模式
   */
  setMode(mode: 'edit' | 'preview' | 'runtime'): void {
    this.updateContext({ mode });
  }

  /**
   * 获取组件映射
   */
  getComponent(library: string, type: string): ComponentMapping | undefined {
    return this.registry.get(library, type);
  }

  /**
   * 解析组件属性
   */
  resolveProps(component: ComponentSchema): ResolvedProps {
    const mapping = this.getComponent(component.library, component.type);
    const defaultProps = mapping?.meta?.defaultProps || {};
    const staticProps = { ...defaultProps, ...component.props };

    // 解析绑定
    const resolved = this.bindingRuntime.resolveComponentBindings(component, staticProps);

    // 如果是 preview/runtime 模式，添加事件处理器
    if (this.context.mode !== 'edit') {
      resolved.eventHandlers = this.eventEngine.createEventHandlers(
        component,
        this.setVariable.bind(this),
        this.refreshDataSource.bind(this)
      );
      resolved.mergedProps = {
        ...resolved.mergedProps,
        ...resolved.eventHandlers,
      };
    }

    return resolved;
  }

  /**
   * 设置变量（供事件处理使用）
   */
  setVariable(scope: 'global' | 'page' | 'component', name: string, value: any): void {
    if (scope === 'global') {
      this.context.globalValues = {
        ...this.context.globalValues,
        [name]: value,
      };
    } else if (scope === 'page') {
      this.context.pageValues = {
        ...this.context.pageValues,
        [name]: value,
      };
    }
    // component 变量需要 componentId，这里简化处理
    this.updateContext(this.context);
  }

  /**
   * 刷新数据源（子类可覆盖实现）
   */
  async refreshDataSource(_name: string): Promise<void> {
    // 默认空实现，子类可覆盖
    console.warn('[BaseRenderer] refreshDataSource not implemented');
  }

  /**
   * 检查组件是否可见
   */
  isComponentVisible(component: ComponentSchema): boolean {
    // 编辑模式总是显示
    if (this.context.mode === 'edit') {
      return component.editor?.visible !== false;
    }

    // 检查 visible 绑定
    if (component.bindings?.visible) {
      const result = this.bindingRuntime.resolveBinding(
        component.bindings.visible,
        component.id
      );
      return Boolean(result);
    }

    // 检查静态 visible 配置
    return component.editor?.visible !== false;
  }

  /**
   * 抽象方法 - 各框架实现具体渲染逻辑
   */
  abstract render(component: ComponentSchema): any;

  /**
   * 抽象方法 - 渲染整个画布
   */
  abstract renderCanvas(): any;
}
