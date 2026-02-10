import { ComponentSchema } from '@/types/schema';
import { getComponentRect } from './geometry';

export type AlignType = 'left' | 'right' | 'top' | 'bottom' | 'horizontalCenter' | 'verticalCenter';
export type DistributeType = 'horizontal' | 'vertical';

/**
 * 计算对齐后各组件的新位置
 */
export const calcAlign = (
  components: ComponentSchema[],
  ids: string[],
  type: AlignType,
  scale: number,
): { id: string; left: number; top: number }[] => {
  if (ids.length < 2) return [];

  const selected = components.filter(c => ids.includes(c.id));
  const rects = selected.map(c => ({ id: c.id, rect: getComponentRect(c, scale) }));

  const results: { id: string; left: number; top: number }[] = [];

  switch (type) {
    case 'left': {
      const minX = Math.min(...rects.map(r => r.rect.x));
      rects.forEach(r => results.push({ id: r.id, left: minX, top: r.rect.y }));
      break;
    }
    case 'right': {
      const maxRight = Math.max(...rects.map(r => r.rect.x + r.rect.width));
      rects.forEach(r => results.push({ id: r.id, left: maxRight - r.rect.width, top: r.rect.y }));
      break;
    }
    case 'top': {
      const minY = Math.min(...rects.map(r => r.rect.y));
      rects.forEach(r => results.push({ id: r.id, left: r.rect.x, top: minY }));
      break;
    }
    case 'bottom': {
      const maxBottom = Math.max(...rects.map(r => r.rect.y + r.rect.height));
      rects.forEach(r => results.push({ id: r.id, left: r.rect.x, top: maxBottom - r.rect.height }));
      break;
    }
    case 'horizontalCenter': {
      const minX = Math.min(...rects.map(r => r.rect.x));
      const maxRight = Math.max(...rects.map(r => r.rect.x + r.rect.width));
      const center = (minX + maxRight) / 2;
      rects.forEach(r => results.push({ id: r.id, left: center - r.rect.width / 2, top: r.rect.y }));
      break;
    }
    case 'verticalCenter': {
      const minY = Math.min(...rects.map(r => r.rect.y));
      const maxBottom = Math.max(...rects.map(r => r.rect.y + r.rect.height));
      const center = (minY + maxBottom) / 2;
      rects.forEach(r => results.push({ id: r.id, left: r.rect.x, top: center - r.rect.height / 2 }));
      break;
    }
  }

  return results;
};

/**
 * 计算等间距分布后各组件的新位置
 */
export const calcDistribute = (
  components: ComponentSchema[],
  ids: string[],
  type: DistributeType,
  scale: number,
): { id: string; left: number; top: number }[] => {
  if (ids.length < 3) return [];

  const selected = components.filter(c => ids.includes(c.id));
  const rects = selected.map(c => ({ id: c.id, rect: getComponentRect(c, scale) }));

  if (type === 'horizontal') {
    rects.sort((a, b) => a.rect.x - b.rect.x);
    const first = rects[0].rect;
    const last = rects[rects.length - 1].rect;
    const totalWidth = rects.reduce((s, r) => s + r.rect.width, 0);
    const totalSpace = (last.x + last.width) - first.x - totalWidth;
    const gap = totalSpace / (rects.length - 1);

    let currentX = first.x;
    return rects.map(r => {
      const result = { id: r.id, left: currentX, top: r.rect.y };
      currentX += r.rect.width + gap;
      return result;
    });
  } else {
    rects.sort((a, b) => a.rect.y - b.rect.y);
    const first = rects[0].rect;
    const last = rects[rects.length - 1].rect;
    const totalHeight = rects.reduce((s, r) => s + r.rect.height, 0);
    const totalSpace = (last.y + last.height) - first.y - totalHeight;
    const gap = totalSpace / (rects.length - 1);

    let currentY = first.y;
    return rects.map(r => {
      const result = { id: r.id, left: r.rect.x, top: currentY };
      currentY += r.rect.height + gap;
      return result;
    });
  }
};
