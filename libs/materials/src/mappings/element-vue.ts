/**
 * Element Plus 组件映射（用于 Vue 渲染器）
 * 
 * 注意：这个文件需要在 Vue 环境中使用，
 * 由于 materials 包主要是 React 环境，这里只提供类型定义和工厂函数。
 * 实际的组件映射应该在 apps/renderer 中完成。
 */
import type { ComponentMapping } from '@mlc/renderer-core';
import { elementPlusMaterialsMeta } from '../meta/element-plus';

/**
 * 创建 Element Plus 组件映射
 * @param components Element Plus 组件对象 { ElButton, ElInput, ... }
 */
export function createElementPlusMappings(
  components: Record<string, any>
): ComponentMapping[] {
  const componentNameMap: Record<string, string> = {
    Button: 'ElButton',
    Input: 'ElInput',
    Card: 'ElCard',
    Text: 'ElText',
    Divider: 'ElDivider',
  };

  const result: ComponentMapping[] = [];
  
  elementPlusMaterialsMeta.forEach((meta) => {
    const componentName = componentNameMap[meta.name];
    const component = components[componentName];
    if (component) {
      result.push({
        type: meta.name,
        library: 'element-plus',
        component,
        meta,
      });
    }
  });

  return result;
}

/**
 * 注册 Element Plus 组件到 Vue 注册表
 */
export function registerElementPlusToVueRegistry(
  registry: { register: (mapping: ComponentMapping) => void },
  components: Record<string, any>
): void {
  createElementPlusMappings(components).forEach((mapping) => {
    registry.register(mapping);
  });
}
