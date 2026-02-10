// 从 @mlc/schema 统一导出所有类型
export type {
  ComponentSchema,
  ComponentStyle,
  EditorConfig,
  ComponentLibrary,
  ComponentFramework,
  CanvasSchema,
  CanvasConfig,
  GridConfig,
  PropFieldType,
  SelectOption,
  PropFieldConfig,
  PropConfig,
  PropGroup,
  EventActionType,
  EventTrigger,
  EventBinding,
  EventDeclaration,
  EventActionConfig,
  NavigateConfig,
  ShowMessageConfig,
  SetStateConfig,
  CallApiConfig,
  CustomCodeConfig,
} from '@mlc/schema';

export { ToolMode } from '@mlc/schema';

// 重导出校验和辅助方法
export {
  validateCanvas,
  validateComponent,
  createEventBinding,
  createDefaultActionConfig,
  addEventToComponent,
  removeEventFromComponent,
  updateEventInComponent,
} from '@mlc/schema';
