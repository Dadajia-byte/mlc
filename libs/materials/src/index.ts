// 类型
export type { MaterialMeta, MaterialLibraryConfig } from './types';

// 元数据（纯数据，框架无关）
export {
  antdMaterialsMeta,
  getAntdMaterialsMeta,
  getAntdMaterialMeta,
  elementPlusMaterialsMeta,
  getElementPlusMaterialsMeta,
  getElementPlusMaterialMeta,
} from './meta';

// 组件映射（关联元数据与组件实现）
export {
  getAntdReactMappings,
  registerAntdToReactRegistry,
  createElementPlusMappings,
  registerElementPlusToVueRegistry,
} from './mappings';

// ===== 兼容旧 API（逐步迁移后可删除）=====
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

export { registerAntdMaterials, registerElementPlusMaterials } from './antd';

export type { ComponentLibrary, ComponentFramework, PropConfig, EventDeclaration } from '@mlc/schema';

export { initMaterials } from './init';
