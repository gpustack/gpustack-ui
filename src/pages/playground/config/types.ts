export interface ModelSelectionItem extends Global.BaseOption<string> {
  uid: number;
  instanceId: symbol;
  type?: string;
}

export type MessageItemAction = 'upload' | 'delete' | 'copy';

export interface MessageItem {
  content: string;
  imgs?: { uid: string | number; dataUrl: string }[];
  role: string;
  title?: React.ReactNode;
  uid: number;
}

type SchemaType =
  | 'Input'
  | 'InputNumber'
  | 'Textarea'
  | 'Select'
  | 'Slider'
  | 'TextArea'
  | 'Checkbox';

export interface ParamsSchema {
  type: SchemaType;
  name: string;
  label: {
    text: string;
    isLocalized?: boolean;
  };
  options?: Global.BaseOption<string | number>[];
  value?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  defaultValue?: string | number | boolean;
  rules: { required: boolean; message?: string }[];
  placeholder?: string;
  attrs?: Record<string, any>;
  description?: {
    text: string;
    isLocalized?: boolean;
  };
}
