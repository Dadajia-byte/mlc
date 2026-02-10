import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.scss';

export interface MenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  children?: MenuItem[];
}

export interface ContextMenuProps {
  items: MenuItem[];
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onClick: (key: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  visible,
  position,
  onClose,
  onClick,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<'right' | 'left'>('right');

  // 调整菜单位置，防止超出视口
  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      setAdjustedPosition({ x: Math.max(10, x), y: Math.max(10, y) });

      // 判断子菜单展开方向
      if (x + rect.width * 2 > viewportWidth) {
        setSubmenuPosition('left');
      } else {
        setSubmenuPosition('right');
      }
    }
  }, [visible, position]);

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.disabled || item.children?.length) return;
    onClick(item.key);
    onClose();
  }, [onClick, onClose]);

  const handleMouseEnter = useCallback((key: string, hasChildren: boolean) => {
    if (hasChildren) {
      setActiveSubmenu(key);
    } else {
      setActiveSubmenu(null);
    }
  }, []);

  if (!visible) return null;

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (item.divider) {
      return <div key={item.key} className="context-menu-divider" />;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isActive = activeSubmenu === item.key;

    return (
      <div
        key={item.key}
        className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${item.danger ? 'danger' : ''} ${isActive ? 'active' : ''}`}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => handleMouseEnter(item.key, !!hasChildren)}
      >
        {item.icon && <span className="context-menu-icon">{item.icon}</span>}
        <span className="context-menu-label">{item.label}</span>
        {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
        {hasChildren && <span className="context-menu-arrow">▶</span>}
        {hasChildren && isActive && (
          <div className={`context-menu-submenu ${submenuPosition}`}>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map(item => renderMenuItem(item))}
    </div>
  );
};

export default ContextMenu;
