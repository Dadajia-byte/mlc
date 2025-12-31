import { useState, useMemo } from 'react';
import styles from '../../index.module.scss';
import { createOperationItems, OperationItem } from '../../config';

const Operation = () => {
  const [switchIndex, setSwitchIndex] = useState(0);

  const items = useMemo(
    () => createOperationItems(setSwitchIndex),
    []
  );

  const renderItem = (item: OperationItem) => {
    if ('isSwitch' in item) {
      return (
        <div className={styles.operation_switch} key={item.label}>
          <div
            className={styles.operation_switch_slider}
            style={{ transform: `translateX(${switchIndex * 100}%)` }}
          />
          {item.text.map((text, index) => (
            <div
              key={index}
              className={`${styles.operation_switch_item} ${index === switchIndex ? styles.operation_switch_item_active : ''}`}
              onClick={() => item.handler(index)}
            >
              {text}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={styles.operation_icon} key={item.label} onClick={item.handler}>
        <i className={`iconfont ${item.icon}`} />
      </div>
    );
  };

  return <div className={styles.operation}>{items.map(renderItem)}</div>;
};

export default Operation;
