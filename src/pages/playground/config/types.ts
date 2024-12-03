import React from 'react';

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
  | 'Checkbox'
  | 'Textarea';

export interface ParamsSchema {
  type: SchemaType;
  name: string;
  label: {
    text: string;
    isLocalized?: boolean;
  };
  style?: React.CSSProperties;
  options?: Global.BaseOption<string | number>[];
  value?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  disabledConfig?: {
    depends: string[];
    when: (values: Record<string, any>) => boolean;
  };
  defaultValue?: string | number | boolean;
  required?: boolean;
  rules: {
    required: boolean;
    message?: string;
    formatter?: (value: any) => any;
  }[];
  placeholder?: React.ReactNode;
  attrs?: Record<string, any>;
  description?: {
    text: string;
    html?: boolean;
    isLocalized?: boolean;
  };
}
