/**
 * 事件动作类型
 */
export type EventActionType =
  | 'navigate'     // 页面跳转
  | 'openUrl'      // 打开外部链接
  | 'showMessage'  // 显示消息提示
  | 'showModal'    // 显示弹窗
  | 'hideModal'    // 隐藏弹窗
  | 'setState'     // 设置变量
  | 'callApi'      // 调用接口
  | 'custom';      // 自定义 JS 代码

/**
 * 事件触发器类型（组件支持的事件名）
 */
export type EventTrigger =
  | 'onClick'
  | 'onDoubleClick'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onSubmit'
  | 'onLoad';

/**
 * 事件绑定配置
 */
export interface EventBinding {
  /** 绑定唯一 ID */
  id: string;
  /** 触发事件名 */
  trigger: EventTrigger;
  /** 动作类型 */
  actionType: EventActionType;
  /** 动作配置（根据 actionType 不同而不同） */
  config: EventActionConfig;
}

/**
 * 跳转配置
 */
export interface NavigateConfig {
  /** 目标路径 */
  url: string;
  /** 是否新窗口打开 */
  newWindow?: boolean;
}

/**
 * 消息提示配置
 */
export interface ShowMessageConfig {
  /** 消息类型 */
  type: 'success' | 'error' | 'warning' | 'info';
  /** 消息内容 */
  content: string;
  /** 持续时间（ms） */
  duration?: number;
}

/**
 * 设置变量配置
 */
export interface SetStateConfig {
  /** 变量名 */
  key: string;
  /** 变量值 */
  value: any;
}

/**
 * 调用接口配置
 */
export interface CallApiConfig {
  /** 请求 URL */
  url: string;
  /** 请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: string;
}

/**
 * 自定义代码配置
 */
export interface CustomCodeConfig {
  /** JavaScript 代码 */
  code: string;
}

/**
 * 事件动作配置（联合类型）
 */
export type EventActionConfig =
  | NavigateConfig
  | ShowMessageConfig
  | SetStateConfig
  | CallApiConfig
  | CustomCodeConfig
  | Record<string, any>;

/**
 * 组件支持的事件声明（在 ComponentMeta 中使用）
 */
export interface EventDeclaration {
  /** 事件触发器名 */
  trigger: EventTrigger;
  /** 显示名称 */
  label: string;
  /** 事件描述 */
  description?: string;
}
