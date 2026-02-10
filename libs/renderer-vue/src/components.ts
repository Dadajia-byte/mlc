import {
  defineComponent,
  h,
  provide,
  inject,
  ref,
  computed,
  watch,
  onMounted,
  PropType,
  InjectionKey,
  Ref,
  VNode,
} from 'vue';
import type { CanvasSchema, ComponentSchema } from '@mlc/schema';
import type { RenderContext, IComponentRegistry, EventActionHandler } from '@mlc/renderer-core';
import { VueRenderer, createVueRenderer, VueRendererConfig } from './renderer';

/**
 * 渲染器上下文
 */
interface RendererContextValue {
  renderer: VueRenderer | null;
  schema: Ref<CanvasSchema | null>;
  context: Ref<RenderContext>;
}

const RendererKey: InjectionKey<RendererContextValue> = Symbol('MlcRenderer');

/**
 * 使用渲染器 Composable
 */
export function useRenderer(): RendererContextValue {
  const context = inject(RendererKey);
  if (!context) {
    throw new Error('useRenderer must be used within a RendererProvider');
  }
  return context;
}

/**
 * 渲染器 Provider 组件
 */
export const RendererProvider = defineComponent({
  name: 'RendererProvider',
  props: {
    registry: {
      type: Object as PropType<IComponentRegistry>,
      required: true,
    },
    schema: {
      type: Object as PropType<CanvasSchema>,
      default: null,
    },
    mode: {
      type: String as PropType<'edit' | 'preview' | 'runtime'>,
      default: 'preview',
    },
    eventHandlers: {
      type: Array as PropType<EventActionHandler[]>,
      default: () => [],
    },
    globalValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    pageValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    dataSourceValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
  },
  setup(props, { slots }) {
    const schemaRef = ref<CanvasSchema | null>(props.schema);

    const renderer = createVueRenderer({
      registry: props.registry,
      eventHandlers: props.eventHandlers,
      defaultMode: props.mode,
    });

    const contextRef = ref<RenderContext>(renderer.getContext());

    // 监听 schema 变化
    watch(
      () => props.schema,
      (newSchema) => {
        schemaRef.value = newSchema;
        if (newSchema) {
          renderer.setSchema(newSchema);
        }
      },
      { immediate: true }
    );

    // 监听上下文变化
    watch(
      [() => props.globalValues, () => props.pageValues, () => props.dataSourceValues],
      ([global, page, data]) => {
        renderer.updateContext({
          globalValues: global,
          pageValues: page,
          dataSourceValues: data,
        });
        contextRef.value = renderer.getContext();
      },
      { immediate: true, deep: true }
    );

    provide(RendererKey, {
      renderer,
      schema: schemaRef,
      context: contextRef,
    });

    return () => slots.default?.();
  },
});

/**
 * 画布渲染组件
 */
export const CanvasRenderer = defineComponent({
  name: 'CanvasRenderer',
  props: {
    schema: {
      type: Object as PropType<CanvasSchema>,
      required: true,
    },
    registry: {
      type: Object as PropType<IComponentRegistry>,
      required: true,
    },
    mode: {
      type: String as PropType<'edit' | 'preview' | 'runtime'>,
      default: 'preview',
    },
    eventHandlers: {
      type: Array as PropType<EventActionHandler[]>,
      default: () => [],
    },
    globalValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    pageValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    dataSourceValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    class: String,
    style: Object as PropType<Record<string, any>>,
  },
  setup(props) {
    const renderer = createVueRenderer({
      registry: props.registry,
      eventHandlers: props.eventHandlers,
      defaultMode: props.mode,
    });

    // 监听变化
    watch(
      () => props.schema,
      (schema) => {
        if (schema) {
          renderer.setSchema(schema);
        }
      },
      { immediate: true }
    );

    watch(
      [() => props.globalValues, () => props.pageValues, () => props.dataSourceValues],
      ([global, page, data]) => {
        renderer.updateContext({
          globalValues: global,
          pageValues: page,
          dataSourceValues: data,
        });
      },
      { immediate: true, deep: true }
    );

    return () => {
      const content = renderer.renderCanvas();
      return h('div', { class: props.class, style: props.style }, content ? [content] : []);
    };
  },
});

/**
 * 单组件渲染器
 */
export const ComponentRenderer = defineComponent({
  name: 'ComponentRenderer',
  props: {
    component: {
      type: Object as PropType<ComponentSchema>,
      required: true,
    },
    registry: {
      type: Object as PropType<IComponentRegistry>,
      required: true,
    },
    mode: {
      type: String as PropType<'edit' | 'preview' | 'runtime'>,
      default: 'preview',
    },
    eventHandlers: {
      type: Array as PropType<EventActionHandler[]>,
      default: () => [],
    },
    globalValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    pageValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    dataSourceValues: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
  },
  setup(props) {
    const renderer = createVueRenderer({
      registry: props.registry,
      eventHandlers: props.eventHandlers,
      defaultMode: props.mode,
    });

    // 创建临时 canvas
    watch(
      () => props.component,
      (component) => {
        const tempCanvas: CanvasSchema = {
          id: 'temp-canvas',
          name: 'Temp',
          width: 0,
          height: 0,
          components: [component],
        };
        renderer.setSchema(tempCanvas);
      },
      { immediate: true }
    );

    watch(
      [() => props.globalValues, () => props.pageValues, () => props.dataSourceValues],
      ([global, page, data]) => {
        renderer.updateContext({
          globalValues: global,
          pageValues: page,
          dataSourceValues: data,
        });
      },
      { immediate: true, deep: true }
    );

    return () => renderer.render(props.component);
  },
});
