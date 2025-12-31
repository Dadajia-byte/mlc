import { create } from 'zustand';
import { CanvasSchema, ComponentSchema, ToolMode } from '@/types/schema';
import { deepClone } from '@mlc/utils';
import { DEFAULT_CANVAS_SCHEMA } from '@/constants';

interface CanvasStore {
  canvas: CanvasSchema | null;
  selectedComponents: string[]; // 选中的组件ID列表
  dragOffset: { x: number; y: number } | null; // 多选拖动时的临时偏移
  history: CanvasSchema[]; // 历史记录
  historyIndex: number; // 历史记录索引
  toolMode: ToolMode; // 工具模式

  /**
   * 设置画布
   */
  setCanvas: (canvas: CanvasSchema) => void;
  /**
   * 添加组件
   */
  addComponent: (component: ComponentSchema, parentId?: string) => void;
  /**
   * 更新组件
   */
  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
  /**
   * 批量更新组件位置（用于多选拖动）
   * @param clearDragOffset 是否同时清除拖动偏移（原子操作，避免闪烁）
   */
  updateComponentsPosition: (updates: { id: string; deltaX: number; deltaY: number }[], clearDragOffset?: boolean) => void;
  /**
   * 设置拖动偏移（用于多选拖动时的实时预览）
   */
  setDragOffset: (offset: { x: number; y: number } | null) => void;
  /**
   * 删除组件
   */
  deleteComponent: (id: string) => void;
  /**
   * 选中组件
   */
  selectComponent: (id: string | null, multiSelect?: boolean) => void;
  /**
   * 撤销
   */
  undo: () => void;
  /**
   * 重做
   */
  redo: () => void;

  setToolMode: (toolMode: ToolMode) => void;
}

const useCanvasStore = create<CanvasStore>((set,get) => ({
  canvas: DEFAULT_CANVAS_SCHEMA,
  selectedComponents: [],
  dragOffset: null,
  history: [],
  historyIndex: -1, 
  toolMode: ToolMode.MOUSE,
  /**
   * 设置画布
   */
  setCanvas: (canvas: CanvasSchema) => {
    set({ canvas }); // 设置画布
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(deepClone(canvas)); // 深拷贝画布
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  /**
   * 添加组件
   */
  addComponent: (component: ComponentSchema, parentId?:string) => {
    const { canvas } = get();
    if (!canvas) return;
    const newCanvas = deepClone(canvas); // 深拷贝画布
    if (parentId) {
      // 添加到指定父组件
      const findAndAdd = (components: ComponentSchema[]): boolean => { // 递归查找并添加组件
        for (const comp of components) {
          if (comp.id === parentId) {
            if (!comp.children) comp.children = [];
            comp.children.push(component);
            return true;
          }
          if (comp.children && findAndAdd(comp.children)) return true;
        }
        return false;
      };
      findAndAdd(newCanvas.components);
    } else {
      // 添加到根级别
      newCanvas.components.push(component);
    }
    
    get().setCanvas(newCanvas);
  },
  /**
   * 更新组件
   */
  updateComponent: (id: string, updates: Partial<ComponentSchema>)=>{
    const { canvas } = get();
    if (!canvas) return;
     // 深拷贝画布
    const newCanvas = deepClone(canvas);
    // 递归查找并更新组件
    const findAndUpdate = (components: ComponentSchema[]): boolean => {
      for (const comp of components) {
        if (comp.id === id) {
          Object.assign(comp, updates);
          return true;
        }
        if (comp.children && findAndUpdate(comp.children)) return true;
      }
      return false;
    };
    findAndUpdate(newCanvas.components) && get().setCanvas(newCanvas);
  },
  /**
   * 批量更新组件位置（用于多选拖动）
   * @param clearDragOffset 是否同时清除拖动偏移（原子操作，避免闪烁）
   */
  updateComponentsPosition: (updates: { id: string; deltaX: number; deltaY: number }[], clearDragOffset = false) => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || updates.length === 0) return;
    
    const newCanvas = deepClone(canvas);
    const updateMap = new Map(updates.map(u => [u.id, u]));
    
    const findAndUpdatePositions = (components: ComponentSchema[]) => {
      for (const comp of components) {
        const update = updateMap.get(comp.id);
        if (update) {
          const currentLeft = (comp.style?.left as number) || 0;
          const currentTop = (comp.style?.top as number) || 0;
          comp.style = {
            ...comp.style,
            left: currentLeft + update.deltaX,
            top: currentTop + update.deltaY,
          };
        }
        if (comp.children) {
          findAndUpdatePositions(comp.children);
        }
      }
    };
    
    findAndUpdatePositions(newCanvas.components);
    
    // 原子操作：同时更新 canvas 和 dragOffset，避免中间状态导致闪烁
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(deepClone(newCanvas));
    
    set({
      canvas: newCanvas,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      ...(clearDragOffset ? { dragOffset: null } : {}),
    });
  },
  /**
   * 设置拖动偏移（用于多选拖动时的实时预览）
   */
  setDragOffset: (offset: { x: number; y: number } | null) => {
    set({ dragOffset: offset });
  },
  /**
   * 删除组件
   */
  deleteComponent: (id: string)=>{
    const { canvas } = get();
    if (!canvas) return;
    const newCanvas = deepClone(canvas);
    const findAndDelete = (components: ComponentSchema[]): boolean => {
      for(let i = 0; i < components.length; i++) {
        if (components[i].id === id) {
          components.splice(i, 1);
          return true;
        }
        if (components[i].children && findAndDelete(components[i].children)) return true;
      }
      return false;
    };
    findAndDelete(newCanvas.components) && get().setCanvas(newCanvas);
    if (get().selectedComponents.includes(id)) {
      set({ selectedComponents: get().selectedComponents.filter(compId => compId !== id) }); // 移除选中的组件ID
    }
  },
  /**
   * 选中组件
   */
  selectComponent: (id: string | null, multiSelect?: boolean)=>{
    const { selectedComponents } = get();
    if (id === null) {
      set({ selectedComponents: [] }); // 清空选中的组件ID列表
    } else if (multiSelect) { // 多选模式
      set({ selectedComponents: selectedComponents.includes(id) 
        ? selectedComponents.filter(compId => compId !== id) 
        : [...selectedComponents, id]
      })
    } else { // 单选模式
      set({ selectedComponents: [id] });
    }
  },
  /**
   * 撤销
   */
  undo: ()=>{
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ canvas: history[newIndex], historyIndex: newIndex });
    }
  },
  /**
   * 重做
   */
  redo: ()=>{
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ canvas: history[newIndex], historyIndex: newIndex });
    }
  },
  /**
   * 设置工具模式
   */
  setToolMode: (toolMode: ToolMode)=>{
    const prevMode = get().toolMode;
    if (prevMode === toolMode) return; // 避免重复设置
    
    set({ toolMode });

    // 抓手模式下清空选中的组件
    if (toolMode === ToolMode.HAND) {
      get().selectComponent(null);
    }
  },
}));

export default useCanvasStore;
