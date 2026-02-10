// 注册表核心
export {
  componentRegistry,
  registerComponent,
  getComponent,
  getAllComponentsMeta,
} from './registry';

export type {
  ComponentMeta,
  ComponentRegistryItem,
  ComponentLibraryConfig,
} from './registry';

// 物料注册
export { registerAntdMaterials, registerElementPlusMaterials } from './antd';

// 类型重导出（方便消费方直接用）
export type { ComponentLibrary, ComponentFramework, PropConfig, EventDeclaration } from '@mlc/schema';

/**
 * 初始化所有物料
 */
export { initMaterials } from './init';
