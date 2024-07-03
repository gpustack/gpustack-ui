import { PageActionType, StatusType } from './types';

export const PageAction: Record<string, PageActionType> = {
  CREATE: 'create',
  UPDATE: 'update',
  VIEW: 'view'
};

export const StatusColorMap: Record<StatusType, { text: string; bg: string }> =
  {
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
      text: `var(--color-progress-green)`,
      bg: `var(--ant-green-1)`
    },
    inactive: {
      text: `var(--ant-color-border)`,
      bg: `var(--ant-color-fill)`
    }
  };

export const StatusMaps = {
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
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])(?=\S+$).{6,12}$/;

export const uppercaseReg = /(?=.*[A-Z])/;

export const lowercaseReg = /(?=.*[a-z])/;

export const digitReg = /(?=.*\d)/;

export const specialCharacterReg = /(?=.*[\W_])/;

export const noSpaceReg = /(?=\S+$)/;

export const lengthReg = /^.{6,12}$/;
