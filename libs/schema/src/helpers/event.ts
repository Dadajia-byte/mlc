import type {
  ComponentSchema,
  EventBinding,
  EventActionType,
  EventTrigger,
  NavigateConfig,
  ShowMessageConfig,
  CallApiConfig,
  CustomCodeConfig,
} from '../types';

/**
 * 创建默认的事件动作配置
 */
export function createDefaultActionConfig(actionType: EventActionType): Record<string, any> {
  switch (actionType) {
    case 'navigate':
    case 'openUrl':
      return { url: '', newWindow: false } satisfies NavigateConfig;
    case 'showMessage':
      return { type: 'info', content: '', duration: 3000 } satisfies ShowMessageConfig;
    case 'showModal':
    case 'hideModal':
      return { targetId: '' };
    case 'setState':
      return { key: '', value: '' };
    case 'callApi':
      return { url: '', method: 'GET', headers: {}, body: '' } satisfies CallApiConfig;
    case 'custom':
      return { code: '// 在此编写自定义代码\n' } satisfies CustomCodeConfig;
    default:
      return {};
  }
}

/**
 * 创建一个新的事件绑定
 */
export function createEventBinding(
  trigger: EventTrigger,
  actionType: EventActionType,
  id: string,
): EventBinding {
  return {
    id,
    trigger,
    actionType,
    config: createDefaultActionConfig(actionType),
  };
}

/**
 * 向组件添加事件绑定（返回新对象，不修改原始）
 */
export function addEventToComponent(
  schema: ComponentSchema,
  binding: EventBinding,
): ComponentSchema {
  return {
    ...schema,
    events: [...(schema.events || []), binding],
  };
}

/**
 * 从组件移除事件绑定
 */
export function removeEventFromComponent(
  schema: ComponentSchema,
  bindingId: string,
): ComponentSchema {
  return {
    ...schema,
    events: (schema.events || []).filter(e => e.id !== bindingId),
  };
}

/**
 * 更新组件的某个事件绑定
 */
export function updateEventInComponent(
  schema: ComponentSchema,
  bindingId: string,
  updates: Partial<EventBinding>,
): ComponentSchema {
  return {
    ...schema,
    events: (schema.events || []).map(e =>
      e.id === bindingId ? { ...e, ...updates } : e
    ),
  };
}
