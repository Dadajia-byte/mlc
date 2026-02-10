import { create } from 'zustand';
import { CanvasSchema, ComponentSchema, ToolMode } from '@/types/schema';
import { deepClone, generateId } from '@mlc/utils';
import { DEFAULT_CANVAS_SCHEMA } from '@/constants';
import { findAndUpdate, findAndDelete, addToParent, traverseComponents, findComponent } from '@/utils/componentTree';
import type { GuideLine } from '@/utils/snap';
import { calcAlign, calcDistribute, AlignType, DistributeType } from '@/utils/align';

// ============ 持久化存储 ============
const STORAGE_KEY = 'mlc_canvas_data';
const AUTO_SAVE_DELAY = 1000; // 1秒防抖

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime: number | null = null;
const saveListeners = new Set<(time: number) => void>();

export const onSaveTimeChange = (listener: (time: number) => void) => {
  saveListeners.add(listener);
  if (lastSaveTime) listener(lastSaveTime);
  return () => { saveListeners.delete(listener); };
};

const saveToStorage = (canvas: CanvasSchema) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(canvas));
      lastSaveTime = Date.now();
      saveListeners.forEach(fn => fn(lastSaveTime!));
    } catch { /* storage full, ignore */ }
  }, AUTO_SAVE_DELAY);
};

const loadFromStorage = (): CanvasSchema | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data) as CanvasSchema;
  } catch { /* corrupted data, ignore */ }
  return null;
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};

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
  guidelines: GuideLine[];

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
  pasteComponents: (position?: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  setToolMode: (toolMode: ToolMode) => void;
  setGuidelines: (guidelines: GuideLine[]) => void;
  // 层级调整
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  // 对齐分布
  alignComponents: (type: AlignType) => void;
  distributeComponents: (type: DistributeType) => void;
  // 分组
  groupComponents: () => void;
  ungroupComponents: () => void;
  // Alt+拖拽复制
  duplicateAtPosition: (sourceIds: string[], deltaX: number, deltaY: number) => void;
  // 图层排序
  reorderComponent: (fromIndex: number, toIndex: number) => void;
}

const storedCanvas = loadFromStorage();
const initialCanvas = storedCanvas ? deepClone(storedCanvas) : deepClone(DEFAULT_CANVAS_SCHEMA);

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
  guidelines: [],

  setCanvas: (canvas: CanvasSchema) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ canvas: deepClone(canvas), timestamp: Date.now() });
    set({ canvas, history: newHistory, historyIndex: newHistory.length - 1 });
    saveToStorage(canvas);
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
    saveToStorage(newCanvas);
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

  pasteComponents: (position?: { x: number; y: number }) => {
    const { canvas, clipboard } = get();
    if (!canvas || clipboard.length === 0) return;
    
    const newCanvas = deepClone(canvas);
    const newIds: string[] = [];
    
    // 计算剪贴板组件的边界框中心
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    clipboard.forEach(comp => {
      const left = (comp.style?.left as number) || 0;
      const top = (comp.style?.top as number) || 0;
      const width = (comp.style?.width as number) || 100;
      const height = (comp.style?.height as number) || 40;
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + width);
      maxY = Math.max(maxY, top + height);
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    clipboard.forEach(comp => {
      const newComp = regenerateIds(comp);
      if (newComp.style) {
        if (position) {
          // 粘贴到指定位置（以鼠标位置为中心）
          const offsetX = position.x - centerX;
          const offsetY = position.y - centerY;
          newComp.style.left = ((newComp.style.left as number) || 0) + offsetX;
          newComp.style.top = ((newComp.style.top as number) || 0) + offsetY;
        } else {
          // 默认偏移 20px
          newComp.style.left = ((newComp.style.left as number) || 0) + 20;
          newComp.style.top = ((newComp.style.top as number) || 0) + 20;
        }
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
      const canvas = history[historyIndex - 1].canvas;
      set({ canvas, historyIndex: historyIndex - 1 });
      saveToStorage(canvas);
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const canvas = history[historyIndex + 1].canvas;
      set({ canvas, historyIndex: historyIndex + 1 });
      saveToStorage(canvas);
    }
  },

  setGuidelines: (guidelines) => set({ guidelines }),

  setToolMode: (toolMode: ToolMode) => {
    if (get().toolMode === toolMode) return;
    set({ toolMode });
    if (toolMode === ToolMode.HAND) {
      get().selectComponent(null);
    }
  },

  // 上移一层
  bringForward: (id: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const index = canvas.components.findIndex(c => c.id === id);
    if (index === -1 || index === canvas.components.length - 1) return;
    
    const newCanvas = deepClone(canvas);
    [newCanvas.components[index], newCanvas.components[index + 1]] = 
      [newCanvas.components[index + 1], newCanvas.components[index]];
    get().setCanvas(newCanvas);
  },

  // 下移一层
  sendBackward: (id: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const index = canvas.components.findIndex(c => c.id === id);
    if (index <= 0) return;
    
    const newCanvas = deepClone(canvas);
    [newCanvas.components[index], newCanvas.components[index - 1]] = 
      [newCanvas.components[index - 1], newCanvas.components[index]];
    get().setCanvas(newCanvas);
  },

  // 置于顶层
  bringToFront: (id: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const index = canvas.components.findIndex(c => c.id === id);
    if (index === -1 || index === canvas.components.length - 1) return;
    
    const newCanvas = deepClone(canvas);
    const [comp] = newCanvas.components.splice(index, 1);
    newCanvas.components.push(comp);
    get().setCanvas(newCanvas);
  },

  // 置于底层
  sendToBack: (id: string) => {
    const { canvas } = get();
    if (!canvas) return;
    const index = canvas.components.findIndex(c => c.id === id);
    if (index <= 0) return;
    
    const newCanvas = deepClone(canvas);
    const [comp] = newCanvas.components.splice(index, 1);
    newCanvas.components.unshift(comp);
    get().setCanvas(newCanvas);
  },

  // 对齐
  alignComponents: (type: AlignType) => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length < 2) return;
    const results = calcAlign(canvas.components, selectedComponents, type, 1);
    if (results.length === 0) return;
    const newCanvas = deepClone(canvas);
    results.forEach(({ id, left, top }) => {
      findAndUpdate(newCanvas.components, id, {
        style: { ...(newCanvas.components.find(c => c.id === id)?.style || {}), left, top },
      });
    });
    get().setCanvas(newCanvas);
  },

  // 等间距分布
  distributeComponents: (type: DistributeType) => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length < 3) return;
    const results = calcDistribute(canvas.components, selectedComponents, type, 1);
    if (results.length === 0) return;
    const newCanvas = deepClone(canvas);
    results.forEach(({ id, left, top }) => {
      findAndUpdate(newCanvas.components, id, {
        style: { ...(newCanvas.components.find(c => c.id === id)?.style || {}), left, top },
      });
    });
    get().setCanvas(newCanvas);
  },

  // 分组：将选中组件编组为一个 Group
  groupComponents: () => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length < 2) return;

    const newCanvas = deepClone(canvas);
    const selectedSet = new Set(selectedComponents);

    // 收集选中的组件（保留原始顺序）
    const groupChildren: ComponentSchema[] = [];
    const remaining: ComponentSchema[] = [];
    let insertIndex = -1;

    newCanvas.components.forEach((comp, idx) => {
      if (selectedSet.has(comp.id)) {
        groupChildren.push(comp);
        if (insertIndex === -1) insertIndex = idx;
      } else {
        remaining.push(comp);
      }
    });

    if (groupChildren.length < 2) return;

    // 计算分组包围盒
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    groupChildren.forEach(comp => {
      const l = (comp.style?.left as number) || 0;
      const t = (comp.style?.top as number) || 0;
      const w = (comp.style?.width as number) || 100;
      const h = (comp.style?.height as number) || 40;
      minX = Math.min(minX, l);
      minY = Math.min(minY, t);
      maxX = Math.max(maxX, l + w);
      maxY = Math.max(maxY, t + h);
    });

    // 将子组件坐标转为相对于 Group 的局部坐标
    groupChildren.forEach(comp => {
      if (comp.style) {
        comp.style.left = ((comp.style.left as number) || 0) - minX;
        comp.style.top = ((comp.style.top as number) || 0) - minY;
      }
    });

    const groupId = generateId('group_');
    const group: ComponentSchema = {
      id: groupId,
      type: 'Group',
      library: 'antd' as any,
      props: {},
      children: groupChildren,
      isGroup: true,
      style: {
        position: 'absolute',
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
      editor: {},
    };

    // 在原位置插入 Group
    remaining.splice(insertIndex, 0, group);
    newCanvas.components = remaining;
    get().setCanvas(newCanvas);
    set({ selectedComponents: [groupId] });
  },

  // 解组：将 Group 拆散为独立组件
  ungroupComponents: () => {
    const { canvas, selectedComponents } = get();
    if (!canvas || selectedComponents.length !== 1) return;

    const groupId = selectedComponents[0];
    const groupIndex = canvas.components.findIndex(c => c.id === groupId);
    if (groupIndex === -1) return;

    const group = canvas.components[groupIndex];
    if (!group.isGroup || !group.children?.length) return;

    const newCanvas = deepClone(canvas);
    const groupComp = newCanvas.components[groupIndex];
    const groupLeft = (groupComp.style?.left as number) || 0;
    const groupTop = (groupComp.style?.top as number) || 0;

    // 将子组件坐标转回画布绝对坐标
    const ungrouped = groupComp.children.map(child => {
      if (child.style) {
        child.style.left = ((child.style.left as number) || 0) + groupLeft;
        child.style.top = ((child.style.top as number) || 0) + groupTop;
      }
      return child;
    });

    // 替换 Group 为其子组件
    newCanvas.components.splice(groupIndex, 1, ...ungrouped);
    get().setCanvas(newCanvas);
    set({ selectedComponents: ungrouped.map(c => c.id) });
  },

  // Alt+拖拽复制：复制源组件并偏移
  duplicateAtPosition: (sourceIds: string[], deltaX: number, deltaY: number) => {
    const { canvas } = get();
    if (!canvas || sourceIds.length === 0) return;
    const newCanvas = deepClone(canvas);
    const newIds: string[] = [];
    sourceIds.forEach(id => {
      const comp = findComponent(canvas.components, id);
      if (!comp) return;
      const newComp = regenerateIds(comp);
      if (newComp.style) {
        newComp.style.left = ((newComp.style.left as number) || 0) + deltaX;
        newComp.style.top = ((newComp.style.top as number) || 0) + deltaY;
      }
      newCanvas.components.push(newComp);
      newIds.push(newComp.id);
    });
    if (newIds.length === 0) return;
    get().setCanvas(newCanvas);
    set({ selectedComponents: newIds });
  },

  // 图层排序：将组件从 fromIndex 移到 toIndex
  reorderComponent: (fromIndex: number, toIndex: number) => {
    const { canvas } = get();
    if (!canvas || fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= canvas.components.length) return;
    if (toIndex < 0 || toIndex >= canvas.components.length) return;
    const newCanvas = deepClone(canvas);
    const [comp] = newCanvas.components.splice(fromIndex, 1);
    newCanvas.components.splice(toIndex, 0, comp);
    get().setCanvas(newCanvas);
  },
}));

export default useCanvasStore;
