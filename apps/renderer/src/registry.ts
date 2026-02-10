import { createVueRegistry } from '@mlc/renderer-vue';
import type { ComponentMapping } from '@mlc/renderer-core';
import { elementPlusMaterialsMeta } from '@mlc/materials';
import {
  ElButton,
  ElInput,
  ElCard,
  ElText,
  ElDivider,
} from 'element-plus';

/**
 * Element Plus 组件映射
 */
const elementPlusComponents: Record<string, any> = {
  Button: ElButton,
  Input: ElInput,
  Card: ElCard,
  Text: ElText,
  Divider: ElDivider,
};

/**
 * 创建并初始化 Vue 组件注册表
 */
export function createElementPlusRegistry() {
  const registry = createVueRegistry();

  // 注册 Element Plus 组件
  elementPlusMaterialsMeta.forEach((meta) => {
    const component = elementPlusComponents[meta.name];
    if (component) {
      registry.register({
        type: meta.name,
        library: 'element-plus',
        component,
        meta,
      });
    }
  });

  return registry;
}

export { elementPlusMaterialsMeta };
