import { ComponentSchema } from '@/types/schema';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const isRectIntersect = (r1: Rect, r2: Rect): boolean =>
  !(r1.x + r1.width < r2.x || r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y || r2.y + r2.height < r1.y);

export const getComponentRect = (comp: ComponentSchema, scale: number): Rect => {
  const x = (comp.style?.left as number) || 0;
  const y = (comp.style?.top as number) || 0;
  let width = (comp.style?.width as number) || 0;
  let height = (comp.style?.height as number) || 0;

  if (!width || !height) {
    const el = document.querySelector(`[data-component-id="${comp.id}"]`) as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      width = width || rect.width / scale;
      height = height || rect.height / scale;
    }
  }

  return { x, y, width: width || 100, height: height || 40 };
};

export const getComponentsInRect = (
  components: ComponentSchema[],
  selectionRect: Rect,
  scale: number
): string[] => {
  const ids: string[] = [];
  const check = (comp: ComponentSchema) => {
    if (isRectIntersect(selectionRect, getComponentRect(comp, scale))) {
      ids.push(comp.id);
    }
    comp.children?.forEach(check);
  };
  components.forEach(check);
  return ids;
};

export const getSelectionBounds = (
  components: ComponentSchema[],
  selectedIds: string[],
  scale: number
): Bounds | null => {
  if (selectedIds.length <= 1) return null;

  const selected = components.filter(c => selectedIds.includes(c.id));
  if (selected.length <= 1) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  selected.forEach(comp => {
    const rect = getComponentRect(comp, scale);
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  return { minX, minY, maxX, maxY };
};

export const clampOffset = (
  offset: { x: number; y: number },
  bounds: Bounds | null,
  canvasSize: { width: number; height: number } | undefined
): { x: number; y: number } => {
  if (!bounds || !canvasSize) return offset;
  return {
    x: Math.max(-bounds.minX, Math.min(canvasSize.width - bounds.maxX, offset.x)),
    y: Math.max(-bounds.minY, Math.min(canvasSize.height - bounds.maxY, offset.y)),
  };
};
