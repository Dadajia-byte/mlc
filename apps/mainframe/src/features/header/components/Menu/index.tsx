import { useState, useRef, useEffect } from 'react';
import styles from '../../index.module.scss';
import { menuItems } from '../../config';

const Menu = () => {
  const [activeIndex, setActiveIndex] = useState(1);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuRef.current) return;
    const items = menuRef.current.querySelectorAll(`.${styles.menu_item}`);
    const activeItem = items[activeIndex] as HTMLElement;
    if (activeItem) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      setUnderlineStyle({
        left: itemRect.left - menuRect.left,
        width: itemRect.width,
      });
    }
  }, [activeIndex]);

  return (
    <div className={styles.menu} ref={menuRef}>
      <div
        className={styles.menu_underline}
        style={{ left: underlineStyle.left, width: underlineStyle.width }}
      />
      {menuItems.map((item, index) => (
        <div
          key={item.name}
          className={`${styles.menu_item} ${activeIndex === index ? styles.menu_item_active : ''}`}
          onClick={() => setActiveIndex(index)}
        >
          <div className={styles.menu_item_text}>{item.text}</div>
        </div>
      ))}
    </div>
  );
};

export default Menu;
