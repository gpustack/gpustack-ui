import React from 'react';

// refer to json schema
export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  title?: string;
  name: string;
  description?: string;
  properties?: Record<string, FieldSchema>;
  default?: any;
  enum?: string[];
  minItems?: number;
  maxItems?: number;
  items?: FieldSchema[];
  widget?: string;
  min?: number;
  style?: React.CSSProperties;
}

export interface FormWidgetProps {
  widget: 'Input' | 'Select' | 'Checkbox' | 'InputNumber';
  name: string;
  title?: string;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  options?: { label: string; value: string | number }[];
  description?: string;
  enum?: (string | number)[];
  style?: React.CSSProperties;
  value?: any;
  checked?: boolean;
  min?: number;
  max?: number;
}
