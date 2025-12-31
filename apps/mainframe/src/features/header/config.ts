export const menuItems = [
  { name: 'home', text: '首页', path: '/', icon: 'home' },
  { name: 'board', text: '画板', path: '/', icon: '' },
  { name: 'projectManagement', text: '项目管理', path: '/', icon: 'home' },
  { name: 'historyVersion', text: '历史版本', path: '/', icon: 'home' },
  { name: 'collaboration', text: '协作', path: '/', icon: 'home' },
];

export interface OperationButton {
  label: string;
  icon?: string;
  handler: () => void;
}

export interface OperationSwitch {
  label: string;
  isSwitch: true;
  text: string[];
  handler: (index: number) => void;
}

export type OperationItem = OperationButton | OperationSwitch;

export const createOperationItems = (
  onSwitchChange: (index: number) => void
): OperationItem[] => [
  { label: '下载', icon: 'icon-xiazai', handler: () => console.log('下载') },
  { label: '复制', icon: 'icon-fuzhi', handler: () => console.log('复制') },
  { label: '转发', icon: 'icon-zhuanfa', handler: () => console.log('转发') },
  { label: '切换', isSwitch: true, text: ['代码', '设计'], handler: onSwitchChange },
  { label: '全屏', icon: 'icon-quanping', handler: () => console.log('全屏') },
  { label: '帮助', icon: 'icon-bangzhu', handler: () => console.log('帮助') },
];
