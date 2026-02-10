import { h, VNode, Component } from 'vue';
import type { ComponentSchema, CanvasSchema } from '@mlc/schema';
import {
  BaseRenderer,
  BaseRendererConfig,
  IComponentRegistry,
} from '@mlc/renderer-core';

export interface VueRendererConfig extends BaseRendererConfig {
  /** 未找到组件时的占位符 */
  NotFoundPlaceholder?: Component;
  /** 加载中占位符 */
  LoadingPlaceholder?: Component;
}

/**
 * Vue 渲染器
 */
export class VueRenderer extends BaseRenderer {
  private NotFoundPlaceholder?: Component;
  private LoadingPlaceholder?: Component;

  constructor(config: VueRendererConfig) {
    super(config);
    this.NotFoundPlaceholder = config.NotFoundPlaceholder;
    this.LoadingPlaceholder = config.LoadingPlaceholder;
  }

  /**
   * 渲染单个组件
   */
  render(component: ComponentSchema): VNode | null {
    // 检查可见性
    if (!this.isComponentVisible(component)) {
      return null;
    }

    // 获取组件映射
    const mapping = this.getComponent(component.library, component.type);
    if (!mapping) {
      if (this.NotFoundPlaceholder) {
        return h(this.NotFoundPlaceholder, {
          type: component.type,
          library: component.library,
          key: component.id,
        });
      }
      return h(
        'div',
        {
          key: component.id,
          style: { color: 'red', padding: '8px' },
        },
        `组件 ${component.library}:${component.type} 未找到`
      );
    }

    // 解析属性
    const resolved = this.resolveProps(component);
    const { mergedProps } = resolved;

    // 提取样式和子内容
    const { style: propsStyle, ...restProps } = mergedProps;
    const componentStyle = component.style || {};

    // 合并样式
    const finalStyle = { ...propsStyle, ...componentStyle };

    // 渲染子组件
    let children: VNode[] | string | undefined;
    if (component.children?.length) {
      children = component.children
        .map((child) => this.render(child))
        .filter((v): v is VNode => v !== null);
    } else if (typeof mergedProps.children === 'string') {
      children = mergedProps.children;
    }

    // 创建 VNode
    return h(
      mapping.component as Component,
      {
        ...restProps,
        style: finalStyle,
        key: component.id,
        'data-component-id': component.id,
      },
      children ? () => children : undefined
    );
  }

  /**
   * 渲染整个画布
   */
  renderCanvas(): VNode | null {
    if (!this.schemaParser) {
      if (this.LoadingPlaceholder) {
        return h(this.LoadingPlaceholder);
      }
      return null;
    }

    const canvas = this.schemaParser.getCanvas();
    const components = canvas.components || [];

    return h(
      'div',
      {
        class: 'mlc-canvas',
        style: {
          width: `${canvas.width}px`,
          height: `${canvas.height}px`,
          position: 'relative',
          background: (canvas.config as any)?.background || '#fff',
        },
      },
      components.map((comp) => this.render(comp)).filter((v): v is VNode => v !== null)
    );
  }
}

/**
 * 创建 Vue 渲染器
 */
export function createVueRenderer(config: VueRendererConfig): VueRenderer {
  return new VueRenderer(config);
}
