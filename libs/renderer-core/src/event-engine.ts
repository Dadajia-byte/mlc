import type { ComponentSchema, EventBinding, EventTrigger } from '@mlc/schema';
import type { EventActionHandler, EventExecutionContext, RenderContext } from './types';

/**
 * 内置事件动作处理器
 */
const builtinHandlers: EventActionHandler[] = [
  {
    type: 'navigate',
    execute: (config) => {
      const { url, newWindow } = config || {};
      if (!url) return;
      if (newWindow) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    },
  },
  {
    type: 'openUrl',
    execute: (config) => {
      const { url, newWindow } = config || {};
      if (!url) return;
      if (newWindow) {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    },
  },
  {
    type: 'showMessage',
    execute: (config) => {
      const { type = 'info', content = '' } = config || {};
      // 简单实现，实际使用时应该由各框架渲染器覆盖
      if (typeof window !== 'undefined') {
        const alertFn = type === 'error' ? console.error : type === 'warn' ? console.warn : console.log;
        alertFn(`[${type.toUpperCase()}] ${content}`);
        
        // 尝试使用原生通知或 alert
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(content);
        }
      }
    },
  },
  {
    type: 'setState',
    execute: (config, context) => {
      const { scope = 'page', name, value } = config || {};
      context.setVariable?.(scope, name, value);
    },
  },
  {
    type: 'refreshDataSource',
    execute: async (config, context) => {
      const { name } = config || {};
      if (name) {
        await context.refreshDataSource?.(name);
      }
    },
  },
  {
    type: 'custom',
    execute: (config, context) => {
      const { code } = config || {};
      if (!code) return;
      try {
        // 创建安全的执行上下文
        const safeContext = {
          $component: context.component,
          $global: context.renderContext.globalValues || {},
          $page: context.renderContext.pageValues || {},
          $data: context.renderContext.dataSourceValues || {},
          console,
          Math,
          Date,
          JSON,
        };
        // eslint-disable-next-line no-new-func
        const fn = new Function(...Object.keys(safeContext), code);
        fn(...Object.values(safeContext));
      } catch (err) {
        console.error('[Custom Event Error]', err);
      }
    },
  },
  {
    type: 'log',
    execute: (config) => {
      const { message, level = 'log' } = config || {};
      (console as any)[level]?.(message);
    },
  },
];

/**
 * 事件执行引擎
 */
export class EventEngine {
  private handlers: Map<string, EventActionHandler> = new Map();
  private renderContext: RenderContext;

  constructor(
    renderContext: RenderContext,
    customHandlers?: EventActionHandler[]
  ) {
    this.renderContext = renderContext;

    // 注册内置处理器
    builtinHandlers.forEach((h) => this.handlers.set(h.type, h));

    // 注册自定义处理器（可覆盖内置）
    customHandlers?.forEach((h) => this.handlers.set(h.type, h));
  }

  /**
   * 注册事件动作处理器
   */
  registerHandler(handler: EventActionHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /**
   * 更新渲染上下文
   */
  updateContext(context: Partial<RenderContext>): void {
    this.renderContext = { ...this.renderContext, ...context };
  }

  /**
   * 执行事件绑定
   */
  async executeBinding(
    binding: EventBinding,
    component: ComponentSchema,
    nativeEvent?: any,
    setVariable?: EventExecutionContext['setVariable'],
    refreshDataSource?: EventExecutionContext['refreshDataSource']
  ): Promise<void> {
    const handler = this.handlers.get(binding.actionType);
    if (!handler) {
      console.warn(`[EventEngine] Unknown action type: ${binding.actionType}`);
      return;
    }

    const context: EventExecutionContext = {
      component,
      nativeEvent,
      renderContext: this.renderContext,
      setVariable,
      refreshDataSource,
    };

    try {
      await handler.execute(binding.config, context);
    } catch (err) {
      console.error(`[EventEngine] Error executing ${binding.actionType}:`, err);
    }
  }

  /**
   * 执行组件的所有指定触发器事件
   */
  async executeTrigger(
    trigger: EventTrigger,
    component: ComponentSchema,
    nativeEvent?: any,
    setVariable?: EventExecutionContext['setVariable'],
    refreshDataSource?: EventExecutionContext['refreshDataSource']
  ): Promise<void> {
    const bindings = component.events?.filter((e) => e.trigger === trigger) || [];
    
    for (const binding of bindings) {
      await this.executeBinding(binding, component, nativeEvent, setVariable, refreshDataSource);
    }
  }

  /**
   * 创建事件处理器 Map（用于传给组件）
   */
  createEventHandlers(
    component: ComponentSchema,
    setVariable?: EventExecutionContext['setVariable'],
    refreshDataSource?: EventExecutionContext['refreshDataSource']
  ): Record<string, (...args: any[]) => void> {
    const events = component.events || [];
    if (!events.length) return {};

    const triggers = new Set(events.map((e) => e.trigger));
    const handlers: Record<string, (...args: any[]) => void> = {};

    triggers.forEach((trigger) => {
      handlers[trigger] = (nativeEvent?: any) => {
        this.executeTrigger(trigger, component, nativeEvent, setVariable, refreshDataSource);
      };
    });

    return handlers;
  }

  /**
   * 获取所有已注册的处理器类型
   */
  getHandlerTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * 创建事件引擎
 */
export function createEventEngine(
  renderContext: RenderContext,
  customHandlers?: EventActionHandler[]
): EventEngine {
  return new EventEngine(renderContext, customHandlers);
}
