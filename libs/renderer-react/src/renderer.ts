import React, { useMemo, useCallback, createElement, Fragment } from 'react';
import type { ComponentSchema, CanvasSchema } from '@mlc/schema';
import {
  BaseRenderer,
  BaseRendererConfig,
  RenderContext,
  EventActionHandler,
  IComponentRegistry,
} from '@mlc/renderer-core';

export interface ReactRendererConfig extends BaseRendererConfig {
  /** 错误边界组件 */
  ErrorBoundary?: React.ComponentType<{ fallback: React.ReactNode; children: React.ReactNode }>;
  /** 未找到组件时的占位符 */
  NotFoundPlaceholder?: React.ComponentType<{ type: string; library: string }>;
  /** 加载中占位符 */
  LoadingPlaceholder?: React.ComponentType;
}

/**
 * React 渲染器
 */
export class ReactRenderer extends BaseRenderer {
  private ErrorBoundary?: React.ComponentType<{ fallback: React.ReactNode; children: React.ReactNode }>;
  private NotFoundPlaceholder?: React.ComponentType<{ type: string; library: string }>;
  private LoadingPlaceholder?: React.ComponentType;

  constructor(config: ReactRendererConfig) {
    super(config);
    this.ErrorBoundary = config.ErrorBoundary;
    this.NotFoundPlaceholder = config.NotFoundPlaceholder;
    this.LoadingPlaceholder = config.LoadingPlaceholder;
  }

  /**
   * 渲染单个组件
   */
  render(component: ComponentSchema): React.ReactNode {
    // 检查可见性
    if (!this.isComponentVisible(component)) {
      return null;
    }

    // 获取组件映射
    const mapping = this.getComponent(component.library, component.type);
    if (!mapping) {
      if (this.NotFoundPlaceholder) {
        return createElement(this.NotFoundPlaceholder, {
          type: component.type,
          library: component.library,
          key: component.id,
        });
      }
      return createElement(
        'div',
        {
          key: component.id,
          style: { color: 'red', padding: 8 },
        },
        `组件 ${component.library}:${component.type} 未找到`
      );
    }

    // 解析属性
    const resolved = this.resolveProps(component);
    const { mergedProps } = resolved;

    // 提取样式
    const { style: propsStyle, children: propsChildren, ...restProps } = mergedProps;
    const componentStyle = component.style || {};

    // 合并样式
    const finalStyle = { ...propsStyle, ...componentStyle };

    // 渲染子组件
    let children: React.ReactNode = propsChildren;
    if (component.children?.length) {
      children = component.children.map((child) => this.render(child));
    }

    // 创建元素
    const element = createElement(
      mapping.component,
      {
        ...restProps,
        style: finalStyle,
        key: component.id,
        'data-component-id': component.id,
      },
      children
    );

    // 包裹错误边界
    if (this.ErrorBoundary) {
      return createElement(
        this.ErrorBoundary,
        {
          key: `error-boundary-${component.id}`,
          fallback: createElement('div', { style: { color: 'red' } }, '组件渲染错误'),
          children: element,
        }
      );
    }

    return element;
  }

  /**
   * 渲染整个画布
   */
  renderCanvas(): React.ReactNode {
    if (!this.schemaParser) {
      if (this.LoadingPlaceholder) {
        return createElement(this.LoadingPlaceholder);
      }
      return null;
    }

    const canvas = this.schemaParser.getCanvas();
    const components = canvas.components || [];

    return createElement(
      'div',
      {
        className: 'mlc-canvas',
        style: {
          width: canvas.width,
          height: canvas.height,
          position: 'relative',
          background: (canvas.config as any)?.background || '#fff',
        },
      },
      components.map((comp) => this.render(comp))
    );
  }
}

/**
 * 创建 React 渲染器
 */
export function createReactRenderer(config: ReactRendererConfig): ReactRenderer {
  return new ReactRenderer(config);
}
