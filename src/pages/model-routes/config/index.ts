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

// Ordered defaults, seeded only when an empty Session Affinity is enabled.
export const DEFAULT_SESSION_KEYS = [
  { type: SESSION_KEY_SOURCE.header, key: 'session-id' },
  { type: SESSION_KEY_SOURCE.header, key: 'x-client-request-id' },
  { type: SESSION_KEY_SOURCE.bodyKey, key: 'prompt_cache_key' }
];

export const LB_POLICY_PLUGINS = {
  'session-affinity': {
    titleId: 'routes.lb.sessionAffinity',
    tipsId: 'routes.lb.sessionAffinity.tips'
  },
  'least-load': {
    titleId: 'routes.lb.leastLoad',
    tipsId: 'routes.lb.leastLoad.tips'
  },
  'decision-service': {
    titleId: 'routes.lb.systemone',
    tipsId: 'routes.lb.systemone.tips'
  }
} as const;

export const POLICY_WEIGHT_CONFIG = {
  influence: { min: 0.1, max: 2, step: 0.1, defaultValue: 1 },
  decision: { min: 1, max: 20, step: 1, defaultValue: 10 }
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
