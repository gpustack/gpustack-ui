import type { CSSProperties } from 'react';

export interface KeyValueFilterValue {
  key: string;
  value: string;
}

export interface KeyValueFilterOption {
  key: string;
  values: string[];
}

export interface KeyValueFilterProps {
  value?: KeyValueFilterValue[];
  options: KeyValueFilterOption[];
  onChange: (value: KeyValueFilterValue[]) => void;
  placeholder?: string;
  title?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  width?: number | string;
  popoverWidth?: number;
  className?: string;
  style?: CSSProperties;
}
