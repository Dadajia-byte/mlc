import styles from './index.module.scss';
import { Menu, Operation } from './components';

const avator = new URL('../../assets/temp/avator.png', import.meta.url).href;

const Header = () => {
  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logo_icon}>LC</div>
        <div className={styles.logo_text}>低代码平台</div>
      </div>
      <Menu />
      <Operation />
      <div className={styles.user}>
        <div className={styles.avator}>
          <img src={avator} />
        </div>
      </div>
    </div>
  )
}

export default Header;