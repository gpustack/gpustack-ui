import { PageActionType, StatusType } from './types';

export const PageAction: Record<string, PageActionType> = {
  CREATE: 'create',
  UPDATE: 'update',
  VIEW: 'view',
  EDIT: 'edit',
  COPY: 'copy'
};

// `StatusColorMap` used to be duplicated here with core-ui's, holding the
// pre-refresh palette values and zero consumers. It is deleted rather than
// resynced: two copies of the status palette is how the product ends up with
// two different greens again. The single source is core-ui's
// `StatusColorMap`, which `StatusTag` / `StatusDot` read.

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
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_+.])[a-zA-Z\d!@#$%^&*_+.]{6,64}$/;

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

/**
 * Label name rules:
 * 1. no more than 63 characters
 * 2. contain only lowercase alphanumeric characters and '-'
 * 3. start and end with an alphanumeric character
 * 4. must not contain consecutive '-' characters
 * 5. must not start with a digit
 * 6. must not end with a '-'
 */

export const validateLabelNameRegxFor63 =
  /^(?![0-9])(?!.*--)[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
