import './index.scss';
import { useState } from 'react';
import Select from '@/components/Select';
const linkStatusList = [
  { status: 0, color: '#65c97a', text: '已连接' },
  { status: 1, color: '#dca550', text: '连接中' },
  { status: 2, color: '#e47470', text: '连接失败'},
]
const selectionList = [
  { value: 0, text: '桌面端视图' },
  { value: 1, text: '自适应' },
  { value: 2, text: 'iPhone SE' },
  { value: 3, text: 'iPhone XR' },
]
const BottomBar = () => {
  const [linkStatus] = useState<typeof linkStatusList[number]>(linkStatusList[0]);
  return (
    <div className="bottom-bar">
      <div className='bottom-bar-link'>
        <div className="bottom-bar-link-status" style={{ backgroundColor: linkStatus.color }}></div>
        <span className="bottom-bar-link-text">{linkStatus.text}</span>
        <div className='bottom-bar-link-lastSaveTime'>最后保存: 2025-10-19 10:00:00</div>
      </div>
      <div className='bottom-bar-option'>
        <div className=''>

        </div>
        <div className='bottom-bar-option-selection'>
          <Select options={selectionList} value={selectionList[0].value} />
        </div>
      </div>
    </div>
  )
}

export default BottomBar;