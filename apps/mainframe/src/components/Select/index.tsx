import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './index.scss';

interface SelectOption {
  value: number | string;
  text: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: number | string;
  onChange?: (value: number | string) => void;
  placeholder?: string;
  className?: string;
}

const Select = ({ options, value, onChange, placeholder = '请选择', className = '' }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | string | undefined>(value);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const selectRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 计算下拉框方向
  const calculateDropdownDirection = () => {
    if (!selectRef.current) return 'down';
    
    const rect = selectRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = options.length * 32 + 16; // 估算下拉框高度
    
    // 如果下方空间不足，则向上展开
    if (rect.bottom + dropdownHeight > viewportHeight) {
      return 'up';
    }
    return 'down';
  };

  const handleToggle = () => {
    if (!isOpen) {
      const direction = calculateDropdownDirection();
      setDropdownDirection(direction);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: number | string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.text : placeholder;

  return (
    <div className={`custom-select ${className}`} ref={selectRef}>
      <div 
        className={`select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="select-text">{displayText}</span>
        <span className={`select-arrow ${dropdownDirection === 'up' ? 'up' : ''}`}>
          <ChevronDown size={14} />
        </span>
      </div>
      
      {isOpen && (
        <div className={`select-dropdown ${dropdownDirection === 'up' ? 'up' : 'down'}`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`select-option ${selectedValue === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;