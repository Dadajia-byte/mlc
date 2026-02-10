import type { ComponentSchema, PropertyBinding } from '@mlc/schema';
import { resolveBinding, createEmptyContext } from '@mlc/schema';
import type { RenderContext, ResolvedProps } from './types';

/**
 * 数据绑定运行时 - 解析组件的绑定属性
 */
export class BindingRuntime {
  private context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  /**
   * 更新运行时上下文
   */
  updateContext(context: Partial<RenderContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 获取当前上下文
   */
  getContext(): RenderContext {
    return this.context;
  }

  /**
   * 构建表达式上下文
   */
  private buildExpressionContext(componentId?: string) {
    const base = createEmptyContext();
    
    return {
      ...base,
      $global: this.context.globalValues || {},
      $page: this.context.pageValues || {},
      $data: this.context.dataSourceValues || {},
      $props: componentId ? (this.context.componentValues?.[componentId] || {}) : {},
      $system: {
        ...base.$system,
        $now: new Date(),
      },
    };
  }

  /**
   * 解析单个绑定
   */
  resolveBinding(binding: PropertyBinding, componentId?: string): any {
    const expressionContext = this.buildExpressionContext(componentId);
    return resolveBinding(binding, expressionContext);
  }

  /**
   * 解析组件的所有绑定属性
   */
  resolveComponentBindings(
    component: ComponentSchema,
    staticProps: Record<string, any>
  ): ResolvedProps {
    const bindings = component.bindings;
    const boundProps: Record<string, any> = {};

    // 解析 props 绑定
    if (bindings?.props) {
      Object.entries(bindings.props).forEach(([key, binding]) => {
        try {
          boundProps[key] = this.resolveBinding(binding, component.id);
        } catch (err) {
          console.error(`[BindingRuntime] Error resolving binding for ${key}:`, err);
          // 保留静态值
          boundProps[key] = staticProps[key];
        }
      });
    }

    // 解析 styles 绑定
    if (bindings?.styles) {
      Object.entries(bindings.styles).forEach(([key, binding]) => {
        try {
          if (!boundProps.style) boundProps.style = {};
          boundProps.style[key] = this.resolveBinding(binding, component.id);
        } catch (err) {
          console.error(`[BindingRuntime] Error resolving style binding for ${key}:`, err);
        }
      });
    }

    // 解析 visible 绑定
    if (bindings?.visible) {
      try {
        boundProps.__visible = this.resolveBinding(bindings.visible, component.id);
      } catch (err) {
        console.error('[BindingRuntime] Error resolving visible binding:', err);
      }
    }

    // 合并属性（绑定属性优先）
    const mergedProps = {
      ...staticProps,
      ...boundProps,
    };

    return {
      staticProps,
      boundProps,
      eventHandlers: {}, // 由 EventEngine 处理
      mergedProps,
    };
  }

  /**
   * 批量解析多个组件
   */
  resolveMultiple(
    components: ComponentSchema[],
    getStaticProps: (comp: ComponentSchema) => Record<string, any>
  ): Map<string, ResolvedProps> {
    const results = new Map<string, ResolvedProps>();
    
    components.forEach((comp) => {
      results.set(comp.id, this.resolveComponentBindings(comp, getStaticProps(comp)));
    });

    return results;
  }

  /**
   * 检查组件是否有有效绑定
   */
  hasBindings(component: ComponentSchema): boolean {
    const bindings = component.bindings;
    if (!bindings) return false;

    return !!(
      (bindings.props && Object.keys(bindings.props).length > 0) ||
      (bindings.styles && Object.keys(bindings.styles).length > 0) ||
      bindings.visible
    );
  }

  /**
   * 获取组件的绑定键列表
   */
  getBindingKeys(component: ComponentSchema): string[] {
    const bindings = component.bindings;
    if (!bindings) return [];

    const keys: string[] = [];
    if (bindings.props) {
      keys.push(...Object.keys(bindings.props).map((k) => `props.${k}`));
    }
    if (bindings.styles) {
      keys.push(...Object.keys(bindings.styles).map((k) => `styles.${k}`));
    }
    if (bindings.visible) {
      keys.push('visible');
    }
    return keys;
  }
}

/**
 * 创建绑定运行时
 */
export function createBindingRuntime(context: RenderContext): BindingRuntime {
  return new BindingRuntime(context);
}
