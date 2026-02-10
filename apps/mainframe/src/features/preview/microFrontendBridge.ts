/**
 * MLC 微前端通信协议
 * 用于 mainframe 与 renderer 子应用之间的通信
 */

// 消息类型
export enum MLC_MESSAGE_TYPE {
  // 渲染器 → 主框架
  RENDERER_READY = 'MLC_RENDERER_READY',
  RENDERER_ERROR = 'MLC_RENDERER_ERROR',
  RENDERER_EVENT = 'MLC_RENDERER_EVENT',
  
  // 主框架 → 渲染器
  SCHEMA_UPDATE = 'MLC_SCHEMA_UPDATE',
  SCHEMA_PATCH = 'MLC_SCHEMA_PATCH',
  CONTEXT_UPDATE = 'MLC_CONTEXT_UPDATE',
  MODE_CHANGE = 'MLC_MODE_CHANGE',
}

// 消息结构
export interface MLCMessage<T = any> {
  type: MLC_MESSAGE_TYPE | string;
  payload?: T;
  timestamp?: number;
  source?: 'mainframe' | 'renderer';
}

// 创建消息
export function createMessage<T>(type: MLC_MESSAGE_TYPE | string, payload?: T): MLCMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source: 'mainframe',
  };
}

/**
 * 微前端通信管理器
 */
export class MicroFrontendBridge {
  private iframe: HTMLIFrameElement | null = null;
  private targetOrigin: string = '*';
  private ready: boolean = false;
  private pendingMessages: MLCMessage[] = [];
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private readyCallbacks: Set<() => void> = new Set();

  constructor(iframe?: HTMLIFrameElement, targetOrigin?: string) {
    if (iframe) this.setIframe(iframe);
    if (targetOrigin) this.targetOrigin = targetOrigin;
    
    // 监听来自 iframe 的消息
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener('message', this.handleMessage);
  }

  /**
   * 设置 iframe 引用
   */
  setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.ready = false;
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent) {
    const data = event.data as MLCMessage;
    if (!data?.type) return;

    // 处理就绪消息
    if (data.type === MLC_MESSAGE_TYPE.RENDERER_READY) {
      this.ready = true;
      // 发送所有待发消息
      this.pendingMessages.forEach(msg => this.send(msg));
      this.pendingMessages = [];
      // 触发就绪回调
      this.readyCallbacks.forEach(cb => cb());
    }

    // 触发对应类型的监听器
    const listeners = this.listeners.get(data.type);
    if (listeners) {
      listeners.forEach(listener => listener(data.payload));
    }
  }

  /**
   * 发送消息到 iframe
   */
  send<T>(message: MLCMessage<T>) {
    if (!this.iframe?.contentWindow) {
      console.warn('[MicroFrontendBridge] No iframe available');
      return;
    }

    if (!this.ready) {
      // 缓存消息，等待就绪后发送
      this.pendingMessages.push(message);
      return;
    }

    this.iframe.contentWindow.postMessage(message, this.targetOrigin);
  }

  /**
   * 发送 Schema 更新
   */
  sendSchema(schema: any) {
    this.send(createMessage(MLC_MESSAGE_TYPE.SCHEMA_UPDATE, schema));
  }

  /**
   * 发送 Schema 部分更新
   */
  sendSchemaPatch(patch: { componentId: string; updates: any }) {
    this.send(createMessage(MLC_MESSAGE_TYPE.SCHEMA_PATCH, patch));
  }

  /**
   * 发送上下文更新
   */
  sendContext(context: { globalValues?: any; pageValues?: any; dataSourceValues?: any }) {
    this.send(createMessage(MLC_MESSAGE_TYPE.CONTEXT_UPDATE, context));
  }

  /**
   * 发送模式切换
   */
  sendModeChange(mode: 'edit' | 'preview' | 'runtime') {
    this.send(createMessage(MLC_MESSAGE_TYPE.MODE_CHANGE, { mode }));
  }

  /**
   * 监听消息
   */
  on(type: MLC_MESSAGE_TYPE | string, callback: (payload: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    
    return () => this.off(type, callback);
  }

  /**
   * 取消监听
   */
  off(type: MLC_MESSAGE_TYPE | string, callback: (payload: any) => void) {
    this.listeners.get(type)?.delete(callback);
  }

  /**
   * 等待就绪
   */
  onReady(callback: () => void) {
    if (this.ready) {
      callback();
    } else {
      this.readyCallbacks.add(callback);
    }
    return () => this.readyCallbacks.delete(callback);
  }

  /**
   * 检查是否就绪
   */
  isReady() {
    return this.ready;
  }

  /**
   * 销毁
   */
  destroy() {
    window.removeEventListener('message', this.handleMessage);
    this.listeners.clear();
    this.readyCallbacks.clear();
    this.pendingMessages = [];
    this.iframe = null;
    this.ready = false;
  }
}

// 导出单例（可选）
let defaultBridge: MicroFrontendBridge | null = null;

export function getDefaultBridge(): MicroFrontendBridge {
  if (!defaultBridge) {
    defaultBridge = new MicroFrontendBridge();
  }
  return defaultBridge;
}

export function createBridge(iframe?: HTMLIFrameElement, targetOrigin?: string): MicroFrontendBridge {
  return new MicroFrontendBridge(iframe, targetOrigin);
}
