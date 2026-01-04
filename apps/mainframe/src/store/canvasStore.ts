import { create } from 'zustand';
import { CanvasSchema, ComponentSchema, ToolMode } from '@/types/schema';
import { deepClone, generateId } from '@mlc/utils';
import { DEFAULT_CANVAS_SCHEMA } from '@/constants';
import { findAndUpdate, findAndDelete, addToParent, traverseComponents, findComponent } from '@/utils/componentTree';

export interface HistoryEntry {
  canvas: CanvasSchema;
  timestamp: number;
}

interface CanvasStore {
  canvas: CanvasSchema | null;
  selectedComponents: string[];
  dragOffset: { x: number; y: number } | null;
  clipboard: ComponentSchema[];
  history: HistoryEntry[];
  historyIndex: number;
  toolMode: ToolMode;

  setCanvas: (canvas: CanvasSchema) => void;
  addComponent: (component: ComponentSchema, parentId?: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
  updateComponentsPosition: (updates: { id: string; deltaX: number; deltaY: number }[], clearDragOffset?: boolean) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
  deleteComponent: (id: string) => void;
  deleteSelectedComponents: () => void;
  selectComponent: (id: string | null, multiSelect?: boolean) => void;
  setSelectedComponents: (ids: string[]) => void;
  copySelectedComponents: () => void;
  cutSelectedComponents: () => void;
  pasteComponents: () => void;
  undo: () => void;
  redo: () => void;
  setToolMode: (toolMode: ToolMode) => void;
}

const initialCanvas = deepClone(DEFAULT_CANVAS_SCHEMA);

// 为组件生成新ID（递归处理子组件）
const regenerateIds = (component: ComponentSchema): ComponentSchema => {
  const newComp = deepClone(component);
  newComp.id = generateId('comp_');
  if (newComp.children?.length) {
    newComp.children = newComp.children.map(regenerateIds);
  }
  return newComp;
};

const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvas: initialCanvas,
  selectedComponents: [],
  dragOffset: null,
  clipboard: [],
  history: [{ canvas: initialCanvas, timestamp: Date.now() }],
  historyIndex: 0,
  toolMode: ToolMode.MOUSE,

  setCanvas: (canvas: CanvasSchema) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ canvas: deepClone(canvas), timestamp: Date.now() });
    set({ canvas, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addComponent: (component: ComponentSchema, parentId?: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const newCanvas = deepClone(canvas);
    if (addToParent(newCanvas.components, component, parentId)) {
      get().setCanvas(newCanvas);
    }
  },

  updateComponent: (id: string, updates: Partial<ComponentSchema>) => {
    const { canvas } = get();
    if (!canvas) return;
    const newCanvas = deepClone(canvas);
    if (findAndUpdate(newCanvas.components, id, updates)) {
      get().setCanvas(newCanvas);
    }
  },

  updateComponentsPosition: (updates: { id: string; deltaX: number; deltaY: number }[], clearDragOffset = false) => {
    const { canvas, history, historyIndex } = get();
    if (!canvas || updates.length === 0) return;

    const newCanvas = deepClone(canvas);
    const updateMap = new Map(updates.map(u => [u.id, u]));

    traverseComponents(newCanvas.components, comp => {
      const update = updateMap.get(comp.id);
      if (update) {
        comp.style = {
          ...comp.style,
          left: ((comp.style?.left as number) || 0) + update.deltaX,
          top: ((comp.style?.top as number) || 0) + update.deltaY,
        };
      }
      return undefined;
    });

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ canvas: deepClone(newCanvas), timestamp: Date.now() });

    set({
      canvas: newCanvas,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      ...(clearDragOffset ? { dragOffset: null } : {}),
    });
  },

  setDragOffset: (offset) => set({ dragOffset: offset }),

  deleteComponent: (id: string) => {
    const { canvas, selectedComponents } = get();
    if (!canvas) return;
    const newCanvas = deepClone(canvas);
    if (findAndDelete(newCanvas.components, id)) {
      get().setCanvas(newCanvas);
      if (selectedComponents.includes(id)) {
        set({ selectedComponents: selectedComponents.filter(cid => cid !== id) });
      }
    }
  },

  deleteSelectedComponents: () => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length === 0) return;
    const newCanvas = deepClone(canvas);
    selectedComponents.forEach(id => findAndDelete(newCanvas.components, id));
    get().setCanvas(newCanvas);
    set({ selectedComponents: [] });
  },

  selectComponent: (id: string | null, multiSelect?: boolean) => {
    const { selectedComponents } = get();
    if (id === null) {
      set({ selectedComponents: [] });
    } else if (multiSelect) {
      set({
        selectedComponents: selectedComponents.includes(id)
          ? selectedComponents.filter(cid => cid !== id)
          : [...selectedComponents, id],
      });
    } else {
      set({ selectedComponents: [id] });
    }
  },

  setSelectedComponents: (ids: string[]) => set({ selectedComponents: ids }),

  copySelectedComponents: () => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length === 0) return;
    const copied: ComponentSchema[] = [];
    selectedComponents.forEach(id => {
      const comp = findComponent(canvas.components, id);
      if (comp) copied.push(deepClone(comp));
    });
    set({ clipboard: copied });
  },

  cutSelectedComponents: () => {
    get().copySelectedComponents();
    get().deleteSelectedComponents();
  },

  pasteComponents: () => {
    const { canvas, clipboard } = get();
    if (!canvas || clipboard.length === 0) return;
    
    const newCanvas = deepClone(canvas);
    const newIds: string[] = [];
    const offset = 20; // 粘贴偏移量
    
    clipboard.forEach(comp => {
      const newComp = regenerateIds(comp);
      // 偏移位置避免重叠
      if (newComp.style) {
        newComp.style.left = ((newComp.style.left as number) || 0) + offset;
        newComp.style.top = ((newComp.style.top as number) || 0) + offset;
      }
      newCanvas.components.push(newComp);
      newIds.push(newComp.id);
    });
    
    get().setCanvas(newCanvas);
    set({ selectedComponents: newIds });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ canvas: history[historyIndex - 1].canvas, historyIndex: historyIndex - 1 });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ canvas: history[historyIndex + 1].canvas, historyIndex: historyIndex + 1 });
    }
  },

  setToolMode: (toolMode: ToolMode) => {
    if (get().toolMode === toolMode) return;
    set({ toolMode });
    if (toolMode === ToolMode.HAND) {
      get().selectComponent(null);
    }
  },
}));

export default useCanvasStore;
