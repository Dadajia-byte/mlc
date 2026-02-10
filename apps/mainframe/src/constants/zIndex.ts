// ============================================
// 层级系统 (z-index) — 与 variables.scss 保持同步
// ============================================

// 画布内部层级
export const Z_CANVAS_SELECTION = 100;
export const Z_RESIZE_HANDLE = 101;
export const Z_SELECTION_BOUNDS = 102;
export const Z_GUIDELINES = 200;
export const Z_CANVAS_HAND_OVERLAY = 300;
export const Z_RESIZE_PREVIEW = 800;

// 选中组件层级提升量
export const Z_SELECTED_LIFT = 10;

// 全局布局层级
export const Z_HEADER = 500;
export const Z_DROPDOWN = 600;
export const Z_POPUP = 700;
export const Z_CONTEXT_MENU = 900;
