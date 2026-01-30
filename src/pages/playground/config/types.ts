import React from 'react';

export interface ModelSelectionItem extends Global.BaseOption<string> {
  uid: number;
  instanceId: symbol;
  type?: string;
}

export type MessageItemAction =
  | 'upload'
  | 'delete'
  | 'copy'
  | 'markdown'
  | 'edit';

export type AudioFormat = 'wav' | 'mp3';

export interface AudioData {
  uid: string | number;
  base64: string;
  format: AudioFormat;
  data: {
    url: string;
    name: string;
    duration: number;
  };
}

export interface MessageItem {
  content: string;
  imgs?: { uid: string | number; dataUrl: string }[];
  audio?: AudioData[];
  role: string;
  title?: React.ReactNode;
  uid: number;
}

type SchemaType =
  | 'Input'
  | 'InputNumber'
  | 'TextArea'
  | 'Select'
  | 'Slider'
  | 'Textarea'
  | 'Checkbox'
  | 'Switch'
  | 'AutoComplete';

export interface ParamsSchema {
  type: SchemaType;
  name: string;
  label: {
    text: string;
    isLocalized?: boolean;
  };
  initAttrs?: (meta: any) => Record<string, any>;
  dependencies?: string[];
  style?: React.CSSProperties;
  options?: Global.BaseOption<string | number | null>[];
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
  formItemAttrs?: Record<string, any>;
  description?: {
    text: string;
    html?: boolean;
    isLocalized?: boolean;
    isLink?: boolean;
  };
}
