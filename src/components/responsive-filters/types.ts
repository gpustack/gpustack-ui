import type { InputProps, SelectProps } from 'antd';
import type { ReactNode } from 'react';
import type { FilterOption } from './filter-option-group';

type FilterKey<Values> = Extract<keyof Values, string>;

export interface FilterRenderContext<Values extends object> {
  value: Values[FilterKey<Values>] | undefined;
  onChange: (value: unknown) => void;
  /** Custom controls must report dropdowns rendered outside their DOM tree. */
  onOpenChange: (open: boolean) => void;
}

interface FilterBase<Values extends object> {
  key: FilterKey<Values>;
  label: string;
  placeholder?: string;
  /** Width in the toolbar, in pixels. Defaults to 160. */
  width?: number;
  /** Auto fields move from the toolbar; popover fields always stay inside. */
  placement?: 'auto' | 'popover';
  disabled?: boolean;
  /** Defaults to '' for inputs and undefined for other controls. */
  clearValue?: Values[FilterKey<Values>];
  isActive?: (value: Values[FilterKey<Values>] | undefined) => boolean;
}

export type ResponsiveFilterConfig<Values extends object> = FilterBase<Values> &
  (
    | {
        type: 'input';
        inputProps?: Omit<
          InputProps,
          'value' | 'defaultValue' | 'onChange' | 'placeholder' | 'disabled'
        >;
      }
    | {
        type: 'select';
        options: NonNullable<SelectProps['options']>;
        selectProps?: Omit<
          SelectProps,
          | 'value'
          | 'defaultValue'
          | 'onChange'
          | 'options'
          | 'placeholder'
          | 'disabled'
        >;
      }
    | {
        type: 'options';
        options: FilterOption<string | number>[];
      }
    | {
        type: 'custom';
        render: (context: FilterRenderContext<Values>) => ReactNode;
      }
  );

export type FilterChangeInfo<Values extends object> =
  | { reason: 'change'; filter: ResponsiveFilterConfig<Values> }
  | { reason: 'clear'; filters: ResponsiveFilterConfig<Values>[] };

export interface ResponsiveFiltersProps<Values extends object> {
  filters: ResponsiveFilterConfig<Values>[];
  values: Values;
  /** Emits one patch per action. Clearing only affects fields in the popover. */
  onChange: (patch: Partial<Values>, info: FilterChangeInfo<Values>) => void;
  suffix?: ReactNode;
  popoverWidth?: number;
}
