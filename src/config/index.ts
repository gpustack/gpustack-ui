import { StatusType } from './types';

export enum PageAction {
  CREATE = 'create',
  UPDATE = 'update',
  VIEW = 'view',
  EDIT = 'edit'
}

export const StatusColorMap: Record<
  StatusType,
  { text: string; bg: string; border?: string }
> = {
  error: {
    text: `var(--ant-red-6)`,
    bg: `var(--ant-red-1)`
  },
  warning: {
    text: `var(--ant-orange-6)`,
    bg: `var(--ant-orange-1)`
  },
  transitioning: {
    text: `var(--ant-blue-6)`,
    bg: `var(--ant-blue-1)`
  },
  success: {
    text: `var(--ant-color-success)`,
    bg: `var(--ant-color-success-bg)`
  },
  inactive: {
    text: `var(--ant-color-text-tertiary)`,
    border: `rgba(200,200,200,1)`,
    bg: `var(--ant-color-fill)`
  }
};

export const StatusMaps: Record<string, StatusType> = {
  error: 'error',
  warning: 'warning',
  transitioning: 'transitioning',
  success: 'success',
  inactive: 'inactive'
};

export const WatchEventType = {
  CREATE: 1,
  UPDATE: 2,
  DELETE: 3
};

export const PasswordReg =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_+])[a-zA-Z\d!@#$%^&*_+]{6,64}$/;

export const uppercaseReg = /(?=.*[A-Z])/;

export const lowercaseReg = /(?=.*[a-z])/;

export const digitReg = /(?=.*\d)/;

export const specialCharacterReg = /(?=.*[\W_])/;

export const noSpaceReg = /(?=\S+$)/;

export const lengthReg = /^.{6,64}$/;

/**
 * Model name rules:
 * 1. no more than 63 characters
 * 2. contain only alphanumeric characters, '-', '_', and '.'
 * 3. start and end with an alphanumeric character
 */
export const modelNameReg =
  /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,61}[A-Za-z0-9])?$/g;
