import { ComponentSchema } from '@/types/schema';
import { getComponentRect, Rect } from './geometry';

export interface GuideLine {
  type: 'vertical' | 'horizontal';
  position: number; // 画布坐标位置
}

export interface SnapResult {
  x: number;
  y: number;
  guidelines: GuideLine[];
}

const SNAP_THRESHOLD = 5; // 吸附阈值（px，画布坐标）

/**
 * 获取组件的 5 条参考线位置（左、中、右 / 上、中、下）
 */
const getRefLines = (rect: Rect) => ({
  left: rect.x,
  centerX: rect.x + rect.width / 2,
  right: rect.x + rect.width,
  top: rect.y,
  centerY: rect.y + rect.height / 2,
  bottom: rect.y + rect.height,
});

/**
 * 计算拖拽时的吸附位置和辅助线
 */
export const calcSnapPosition = (
  /** 拖拽中的组件 rect */
  dragRect: Rect,
  /** 所有组件 */
  components: ComponentSchema[],
  /** 被拖拽的组件 id 列表（排除自身） */
  dragIds: string[],
  /** 画布缩放 */
  scale: number,
  /** 画布尺寸 */
  canvasSize?: { width: number; height: number },
): SnapResult => {
  const guidelines: GuideLine[] = [];
  const dragRef = getRefLines(dragRect);

  // 收集所有参考矩形（排除拖拽中的组件）
  const refRects: { x: number; cx: number; r: number; y: number; cy: number; b: number }[] = [];

  components.forEach(comp => {
    if (dragIds.includes(comp.id)) return;
    const rect = getComponentRect(comp, scale);
    const ref = getRefLines(rect);
    refRects.push({ x: ref.left, cx: ref.centerX, r: ref.right, y: ref.top, cy: ref.centerY, b: ref.bottom });
  });

  // 画布边界也作为参考
  if (canvasSize) {
    refRects.push({
      x: 0, cx: canvasSize.width / 2, r: canvasSize.width,
      y: 0, cy: canvasSize.height / 2, b: canvasSize.height,
    });
  }

  let bestDx = Infinity;
  let bestDy = Infinity;
  let snapX = dragRect.x;
  let snapY = dragRect.y;

  // 水平吸附（X 轴方向）
  for (const ref of refRects) {
    const checks = [
      { drag: dragRef.left, target: ref.x },
      { drag: dragRef.left, target: ref.cx },
      { drag: dragRef.left, target: ref.r },
      { drag: dragRef.centerX, target: ref.x },
      { drag: dragRef.centerX, target: ref.cx },
      { drag: dragRef.centerX, target: ref.r },
      { drag: dragRef.right, target: ref.x },
      { drag: dragRef.right, target: ref.cx },
      { drag: dragRef.right, target: ref.r },
    ];

    for (const { drag, target } of checks) {
      const diff = Math.abs(drag - target);
      if (diff < SNAP_THRESHOLD && diff < Math.abs(bestDx)) {
        bestDx = target - drag;
        snapX = dragRect.x + bestDx;
      }
    }
  }

  // 垂直吸附（Y 轴方向）
  for (const ref of refRects) {
    const checks = [
      { drag: dragRef.top, target: ref.y },
      { drag: dragRef.top, target: ref.cy },
      { drag: dragRef.top, target: ref.b },
      { drag: dragRef.centerY, target: ref.y },
      { drag: dragRef.centerY, target: ref.cy },
      { drag: dragRef.centerY, target: ref.b },
      { drag: dragRef.bottom, target: ref.y },
      { drag: dragRef.bottom, target: ref.cy },
      { drag: dragRef.bottom, target: ref.b },
    ];

    for (const { drag, target } of checks) {
      const diff = Math.abs(drag - target);
      if (diff < SNAP_THRESHOLD && diff < Math.abs(bestDy)) {
        bestDy = target - drag;
        snapY = dragRect.y + bestDy;
      }
    }
  }

  // 收集最终对齐的辅助线
  const snappedRef = getRefLines({ ...dragRect, x: snapX, y: snapY });

  for (const ref of refRects) {
    // 垂直辅助线（X 对齐）
    if (Math.abs(snappedRef.left - ref.x) < 0.5) guidelines.push({ type: 'vertical', position: ref.x });
    if (Math.abs(snappedRef.left - ref.cx) < 0.5) guidelines.push({ type: 'vertical', position: ref.cx });
    if (Math.abs(snappedRef.left - ref.r) < 0.5) guidelines.push({ type: 'vertical', position: ref.r });
    if (Math.abs(snappedRef.centerX - ref.x) < 0.5) guidelines.push({ type: 'vertical', position: ref.x });
    if (Math.abs(snappedRef.centerX - ref.cx) < 0.5) guidelines.push({ type: 'vertical', position: ref.cx });
    if (Math.abs(snappedRef.centerX - ref.r) < 0.5) guidelines.push({ type: 'vertical', position: ref.r });
    if (Math.abs(snappedRef.right - ref.x) < 0.5) guidelines.push({ type: 'vertical', position: ref.x });
    if (Math.abs(snappedRef.right - ref.cx) < 0.5) guidelines.push({ type: 'vertical', position: ref.cx });
    if (Math.abs(snappedRef.right - ref.r) < 0.5) guidelines.push({ type: 'vertical', position: ref.r });

    // 水平辅助线（Y 对齐）
    if (Math.abs(snappedRef.top - ref.y) < 0.5) guidelines.push({ type: 'horizontal', position: ref.y });
    if (Math.abs(snappedRef.top - ref.cy) < 0.5) guidelines.push({ type: 'horizontal', position: ref.cy });
    if (Math.abs(snappedRef.top - ref.b) < 0.5) guidelines.push({ type: 'horizontal', position: ref.b });
    if (Math.abs(snappedRef.centerY - ref.y) < 0.5) guidelines.push({ type: 'horizontal', position: ref.y });
    if (Math.abs(snappedRef.centerY - ref.cy) < 0.5) guidelines.push({ type: 'horizontal', position: ref.cy });
    if (Math.abs(snappedRef.centerY - ref.b) < 0.5) guidelines.push({ type: 'horizontal', position: ref.b });
    if (Math.abs(snappedRef.bottom - ref.y) < 0.5) guidelines.push({ type: 'horizontal', position: ref.y });
    if (Math.abs(snappedRef.bottom - ref.cy) < 0.5) guidelines.push({ type: 'horizontal', position: ref.cy });
    if (Math.abs(snappedRef.bottom - ref.b) < 0.5) guidelines.push({ type: 'horizontal', position: ref.b });
  }

  // 去重
  const uniqueGuidelines = guidelines.filter((g, i, arr) =>
    arr.findIndex(o => o.type === g.type && Math.abs(o.position - g.position) < 0.5) === i
  );

  return {
    x: snapX,
    y: snapY,
    guidelines: uniqueGuidelines,
  };
};
