export interface DropDownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  iconfont?: boolean;
}

export type PageActionType = 'create' | 'update' | 'view' | 'edit' | 'copy';

export type StatusType =
  | 'error'
  | 'warning'
  | 'transitioning'
  | 'success'
  | 'inactive';
