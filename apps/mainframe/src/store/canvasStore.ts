import { create } from 'zustand';
import { CanvasSchema, ComponentSchema, ToolMode } from '@/types/schema';
import { deepClone } from '@mlc/utils';
import { DEFAULT_CANVAS_SCHEMA } from '@/constants';
import { findAndUpdate, findAndDelete, addToParent, traverseComponents } from '@/utils/componentTree';

interface CanvasStore {
  canvas: CanvasSchema | null;
  selectedComponents: string[];
  dragOffset: { x: number; y: number } | null;
  history: CanvasSchema[];
  historyIndex: number;
  toolMode: ToolMode;

  setCanvas: (canvas: CanvasSchema) => void;
  addComponent: (component: ComponentSchema, parentId?: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
  updateComponentsPosition: (updates: { id: string; deltaX: number; deltaY: number }[], clearDragOffset?: boolean) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null, multiSelect?: boolean) => void;
  setSelectedComponents: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  setToolMode: (toolMode: ToolMode) => void;
}

const useCanvasStore = create<CanvasStore>((set, get) => ({
  canvas: DEFAULT_CANVAS_SCHEMA,
  selectedComponents: [],
  dragOffset: null,
  history: [],
  historyIndex: -1,
  toolMode: ToolMode.MOUSE,

  setCanvas: (canvas: CanvasSchema) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(deepClone(canvas));
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
    newHistory.push(deepClone(newCanvas));

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

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({ canvas: history[historyIndex - 1], historyIndex: historyIndex - 1 });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ canvas: history[historyIndex + 1], historyIndex: historyIndex + 1 });
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
