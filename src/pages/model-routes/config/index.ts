import { StatusMaps } from '@/config';
import { StatusType } from '@/config/types';
import { icons } from '@gpustack/core-ui';

export const TargetStatusValueMap: Record<string, string> = {
  Active: 'active',
  Unavailable: 'unavailable'
};

export const TargetStatusLabelMap = {
  [TargetStatusValueMap.Active]: 'Active',
  [TargetStatusValueMap.Unavailable]: 'Unavailable'
};

export const TargetStatus: Record<string, StatusType> = {
  [TargetStatusValueMap.Active]: StatusMaps.success,
  [TargetStatusValueMap.Unavailable]: StatusMaps.warning
};

// actions for each row
export const rowActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: icons.ExperimentOutlined
  },
  {
    label: 'models.table.button.apiAccessInfo',
    key: 'api',
    icon: icons.ApiOutlined
  },
  {
    label: 'models.button.accessSettings',
    key: 'accessControl',
    icon: icons.Permission
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

export const genericReferLink = `https://docs.gpustack.ai/latest/user-guide/model-deployment-management/#enable-generic-proxy`;

// Form-level LB mode: "weighted" = every target carries weight>0 (traffic
// splitting); "policy" = all weights 0, targets picked by the capability
// plugins — or round-robin, the gateway's own default, when none is enabled.
export const LB_FORM_MODE = {
  weighted: 'weighted',
  policy: 'policy'
} as const;

// sessionKey source types; each chain entry has exactly one of them.
export const SESSION_KEY_SOURCE = {
  header: 'header',
  bodyKey: 'bodyKey'
} as const;

// List rendering for the server-derived `lb_mode` (plain text — the column
// shows no status color).
export const LbModeStatusMap: Record<string, { textId: string }> = {
  weighted: { textId: 'routes.lb.mode.weighted' },
  // The list badge says "Policy" to mirror the form's "Policy Routing"
  // choice — scoring is what that intent lands on when plugins are enabled.
  scoring: { textId: 'routes.lb.mode.policy' },
  invalid: { textId: 'routes.lb.mode.invalid' }
};
