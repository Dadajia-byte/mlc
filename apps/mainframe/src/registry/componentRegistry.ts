/**
 * 组件注册表 - 薄代理层
 * 实际逻辑已迁移至 @mlc/materials，此文件保持 mainframe 内部引用路径不变
 */
export {
  componentRegistry,
  registerComponent,
  getComponent,
  getAllComponentsMeta,
} from '@mlc/materials';

export type {
  ComponentMeta,
  ComponentRegistryItem,
  ComponentLibraryConfig,
  ComponentLibrary,
  ComponentFramework,
} from '@mlc/materials';
