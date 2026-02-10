import type { Component } from 'vue';
import {
  createComponentRegistry,
  IComponentRegistry,
  ComponentMapping,
  ComponentMetadata,
} from '@mlc/renderer-core';

/**
 * Vue 组件注册表
 */
export class VueComponentRegistry implements IComponentRegistry {
  private inner = createComponentRegistry();

  /**
   * 注册 Vue 组件
   */
  register(mapping: ComponentMapping): void {
    this.inner.register(mapping);
  }

  /**
   * 批量注册组件
   */
  registerMany(mappings: ComponentMapping[]): void {
    mappings.forEach((m) => this.register(m));
  }

  /**
   * 注册 Vue 组件（便捷方法）
   */
  registerComponent(
    library: string,
    type: string,
    component: Component,
    meta?: ComponentMetadata
  ): void {
    this.register({
      library,
      type,
      component,
      meta,
    });
  }

  /**
   * 获取组件
   */
  get(library: string, type: string): ComponentMapping | undefined {
    return this.inner.get(library, type);
  }

  /**
   * 获取 Vue 组件
   */
  getComponent(library: string, type: string): Component | undefined {
    return this.get(library, type)?.component;
  }

  /**
   * 获取所有组件
   */
  getAll(): ComponentMapping[] {
    return this.inner.getAll();
  }

  /**
   * 按库获取组件
   */
  getByLibrary(library: string): ComponentMapping[] {
    return this.inner.getByLibrary(library);
  }

  /**
   * 获取所有元数据
   */
  getAllMetadata(): ComponentMetadata[] {
    return this.getAll()
      .map((m) => m.meta)
      .filter((m): m is ComponentMetadata => !!m);
  }
}

/**
 * 创建 Vue 组件注册表
 */
export function createVueRegistry(): VueComponentRegistry {
  return new VueComponentRegistry();
}
