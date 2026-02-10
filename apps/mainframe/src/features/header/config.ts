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
