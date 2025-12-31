import { ComponentSchema } from '@/types/schema';

export type ComponentVisitor<T> = (comp: ComponentSchema, parent?: ComponentSchema[]) => T | undefined;

/**
 * 遍历组件树
 * @param components 组件树
 * @param visitor 访问器
 */
export const traverseComponents = <T>(
  components: ComponentSchema[],
  visitor: ComponentVisitor<T>
): T | undefined => {
  for (const comp of components) {
    const result = visitor(comp, components);
    if (result !== undefined) return result;
    if (comp.children) {
      const childResult = traverseComponents(comp.children, visitor);
      if (childResult !== undefined) return childResult;
    }
  }
  return undefined;
};

/**
 * 查找组件
 * @param components 组件树
 * @param id 组件ID
 */
export const findComponent = (
  components: ComponentSchema[],
  id: string
): ComponentSchema | undefined => {
  return traverseComponents(components, comp => comp.id === id ? comp : undefined);
};

/**
 * 查找并更新组件
 * @param components 组件树
 * @param id 组件ID
 * @param updates 更新内容
 */
export const findAndUpdate = (
  components: ComponentSchema[],
  id: string,
  updates: Partial<ComponentSchema>
): boolean => {
  return traverseComponents(components, comp => {
    if (comp.id === id) {
      Object.assign(comp, updates);
      return true;
    }
    return undefined;
  }) ?? false;
};

/**
 * 查找并删除组件
 * @param components 组件树
 * @param id 组件ID
 */
export const findAndDelete = (components: ComponentSchema[], id: string): boolean => {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) {
      components.splice(i, 1);
      return true;
    }
    if (components[i].children && findAndDelete(components[i].children!, id)) {
      return true;
    }
  }
  return false;
};

/**
 * 将组件添加到父组件
 * @param components 组件树
 * @param component 组件
 * @param parentId 父组件ID
 */
export const addToParent = (
  components: ComponentSchema[],
  component: ComponentSchema,
  parentId?: string
): boolean => {
  if (!parentId) {
    components.push(component);
    return true;
  }
  return traverseComponents(components, comp => {
    if (comp.id === parentId) {
      if (!comp.children) comp.children = [];
      comp.children.push(component);
      return true;
    }
    return undefined;
  }) ?? false;
};
