import { create } from 'zustand';
import type {
  VariableDefinition,
  DataSourceDefinition,
  ExpressionContext,
} from '@mlc/schema';
import {
  createVariable,
  createStaticDataSource,
  createApiDataSource,
  getValueByPath,
} from '@mlc/schema';
import useCanvasStore from './canvasStore';

interface DataBindingStore {
  // 运行时变量值
  globalValues: Record<string, any>;
  pageValues: Record<string, any>;
  componentValues: Record<string, Record<string, any>>; // componentId -> values
  
  // 数据源数据
  dataSourceValues: Record<string, any>;
  dataSourceLoading: Record<string, boolean>;
  dataSourceErrors: Record<string, string | null>;

  // 变量操作
  setGlobalValue: (name: string, value: any) => void;
  setPageValue: (name: string, value: any) => void;
  setComponentValue: (componentId: string, name: string, value: any) => void;
  
  // 数据源操作
  fetchDataSource: (dataSource: DataSourceDefinition) => Promise<void>;
  setDataSourceValue: (name: string, value: any) => void;
  
  // 变量定义操作（同步到 canvas）
  addGlobalVariable: (variable: Omit<VariableDefinition, 'id' | 'scope'>) => void;
  addPageVariable: (variable: Omit<VariableDefinition, 'id' | 'scope'>) => void;
  removeVariable: (id: string, scope: 'global' | 'page') => void;
  updateVariable: (id: string, updates: Partial<VariableDefinition>) => void;
  
  // 数据源定义操作
  addDataSource: (dataSource: Omit<DataSourceDefinition, 'id'>) => void;
  removeDataSource: (id: string) => void;
  updateDataSource: (id: string, updates: Partial<DataSourceDefinition>) => void;
  
  // 获取表达式上下文
  getExpressionContext: (componentId?: string) => ExpressionContext;
  
  // 初始化（从 canvas 加载）
  initFromCanvas: () => void;
  
  // 重置
  reset: () => void;
}

const useDataBindingStore = create<DataBindingStore>((set, get) => ({
  globalValues: {},
  pageValues: {},
  componentValues: {},
  dataSourceValues: {},
  dataSourceLoading: {},
  dataSourceErrors: {},

  setGlobalValue: (name, value) => {
    set((state) => ({
      globalValues: { ...state.globalValues, [name]: value },
    }));
  },

  setPageValue: (name, value) => {
    set((state) => ({
      pageValues: { ...state.pageValues, [name]: value },
    }));
  },

  setComponentValue: (componentId, name, value) => {
    set((state) => ({
      componentValues: {
        ...state.componentValues,
        [componentId]: {
          ...state.componentValues[componentId],
          [name]: value,
        },
      },
    }));
  },

  fetchDataSource: async (dataSource) => {
    if (dataSource.type !== 'api' || !dataSource.apiConfig) return;

    const { name, apiConfig } = dataSource;
    
    set((state) => ({
      dataSourceLoading: { ...state.dataSourceLoading, [name]: true },
      dataSourceErrors: { ...state.dataSourceErrors, [name]: null },
    }));

    try {
      const { url, method, headers, params, body, responsePath } = apiConfig;
      
      // 构建 URL
      let fullUrl = url;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
          searchParams.append(key, String(val));
        });
        fullUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }

      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();
      
      // 按路径提取数据
      if (responsePath) {
        data = getValueByPath(data, responsePath);
      }

      set((state) => ({
        dataSourceValues: { ...state.dataSourceValues, [name]: data },
        dataSourceLoading: { ...state.dataSourceLoading, [name]: false },
      }));
    } catch (err) {
      set((state) => ({
        dataSourceLoading: { ...state.dataSourceLoading, [name]: false },
        dataSourceErrors: {
          ...state.dataSourceErrors,
          [name]: err instanceof Error ? err.message : '请求失败',
        },
      }));
    }
  },

  setDataSourceValue: (name, value) => {
    set((state) => ({
      dataSourceValues: { ...state.dataSourceValues, [name]: value },
    }));
  },

  addGlobalVariable: (variable) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    const newVar = createVariable(
      variable.name,
      variable.type,
      'global',
      variable.defaultValue,
      { label: variable.label, description: variable.description }
    );

    const newCanvas = {
      ...canvas,
      globalVariables: [...(canvas.globalVariables || []), newVar],
    };
    useCanvasStore.getState().setCanvas(newCanvas);

    // 初始化运行时值
    get().setGlobalValue(newVar.name, newVar.defaultValue);
  },

  addPageVariable: (variable) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    const newVar = createVariable(
      variable.name,
      variable.type,
      'page',
      variable.defaultValue,
      { label: variable.label, description: variable.description }
    );

    const newCanvas = {
      ...canvas,
      pageVariables: [...(canvas.pageVariables || []), newVar],
    };
    useCanvasStore.getState().setCanvas(newCanvas);

    get().setPageValue(newVar.name, newVar.defaultValue);
  },

  removeVariable: (id, scope) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    const key = scope === 'global' ? 'globalVariables' : 'pageVariables';
    const variables = canvas[key] || [];
    const variable = variables.find((v) => v.id === id);

    if (variable) {
      const newCanvas = {
        ...canvas,
        [key]: variables.filter((v) => v.id !== id),
      };
      useCanvasStore.getState().setCanvas(newCanvas);

      // 清除运行时值
      if (scope === 'global') {
        const { [variable.name]: _, ...rest } = get().globalValues;
        set({ globalValues: rest });
      } else {
        const { [variable.name]: _, ...rest } = get().pageValues;
        set({ pageValues: rest });
      }
    }
  },

  updateVariable: (id, updates) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    // 查找变量在哪个列表
    let found = false;
    const globalVariables = (canvas.globalVariables || []).map((v) => {
      if (v.id === id) {
        found = true;
        return { ...v, ...updates };
      }
      return v;
    });

    if (found) {
      useCanvasStore.getState().setCanvas({ ...canvas, globalVariables });
      return;
    }

    const pageVariables = (canvas.pageVariables || []).map((v) => {
      if (v.id === id) {
        return { ...v, ...updates };
      }
      return v;
    });
    useCanvasStore.getState().setCanvas({ ...canvas, pageVariables });
  },

  addDataSource: (dataSource) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    let newDs: DataSourceDefinition;
    if (dataSource.type === 'static') {
      newDs = createStaticDataSource(
        dataSource.name,
        dataSource.staticConfig?.data,
        { label: dataSource.label, description: dataSource.description }
      );
    } else if (dataSource.type === 'api') {
      newDs = createApiDataSource(
        dataSource.name,
        dataSource.apiConfig!,
        { label: dataSource.label, description: dataSource.description }
      );
    } else {
      return;
    }

    const newCanvas = {
      ...canvas,
      dataSources: [...(canvas.dataSources || []), newDs],
    };
    useCanvasStore.getState().setCanvas(newCanvas);

    // 如果是静态数据源，立即设置值
    if (newDs.type === 'static' && newDs.staticConfig) {
      get().setDataSourceValue(newDs.name, newDs.staticConfig.data);
    }
    // 如果是 API 数据源且自动请求，立即请求
    if (newDs.type === 'api' && newDs.apiConfig?.autoFetch) {
      get().fetchDataSource(newDs);
    }
  },

  removeDataSource: (id) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    const dataSources = canvas.dataSources || [];
    const ds = dataSources.find((d) => d.id === id);
    if (ds) {
      const newCanvas = {
        ...canvas,
        dataSources: dataSources.filter((d) => d.id !== id),
      };
      useCanvasStore.getState().setCanvas(newCanvas);

      // 清除运行时数据
      const { [ds.name]: _, ...rest } = get().dataSourceValues;
      set({ dataSourceValues: rest });
    }
  },

  updateDataSource: (id, updates) => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    const dataSources = (canvas.dataSources || []).map((d) => {
      if (d.id === id) {
        return { ...d, ...updates };
      }
      return d;
    });
    useCanvasStore.getState().setCanvas({ ...canvas, dataSources });
  },

  getExpressionContext: (componentId) => {
    const { globalValues, pageValues, componentValues, dataSourceValues } = get();
    const canvas = useCanvasStore.getState().canvas;
    
    // 获取组件 props
    let componentProps: Record<string, any> = {};
    if (componentId && canvas) {
      const findComp = (comps: any[]): any => {
        for (const c of comps) {
          if (c.id === componentId) return c;
          if (c.children?.length) {
            const found = findComp(c.children);
            if (found) return found;
          }
        }
        return null;
      };
      const comp = findComp(canvas.components);
      if (comp) {
        componentProps = comp.props || {};
      }
    }

    return {
      $global: globalValues,
      $page: pageValues,
      $component: componentId ? componentValues[componentId] || {} : {},
      $data: dataSourceValues,
      $props: componentProps,
      $system: {
        $now: new Date(),
      },
    };
  },

  initFromCanvas: () => {
    const canvas = useCanvasStore.getState().canvas;
    if (!canvas) return;

    // 初始化全局变量值
    const globalValues: Record<string, any> = {};
    (canvas.globalVariables || []).forEach((v) => {
      globalValues[v.name] = v.defaultValue;
    });

    // 初始化页面变量值
    const pageValues: Record<string, any> = {};
    (canvas.pageVariables || []).forEach((v) => {
      pageValues[v.name] = v.defaultValue;
    });

    // 初始化静态数据源
    const dataSourceValues: Record<string, any> = {};
    (canvas.dataSources || []).forEach((ds) => {
      if (ds.type === 'static' && ds.staticConfig) {
        dataSourceValues[ds.name] = ds.staticConfig.data;
      }
    });

    set({ globalValues, pageValues, dataSourceValues });

    // 请求自动加载的 API 数据源
    (canvas.dataSources || []).forEach((ds) => {
      if (ds.type === 'api' && ds.apiConfig?.autoFetch) {
        get().fetchDataSource(ds);
      }
    });
  },

  reset: () => {
    set({
      globalValues: {},
      pageValues: {},
      componentValues: {},
      dataSourceValues: {},
      dataSourceLoading: {},
      dataSourceErrors: {},
    });
  },
}));

export default useDataBindingStore;
