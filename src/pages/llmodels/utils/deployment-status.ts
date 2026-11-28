import { StatusMaps } from '@/config';
import type { useIntl } from '@umijs/max';
import {
  modelReplicaCounts,
  ModelStateLabelMap,
  ModelStateMap,
  ModelStateValueMap,
  MyModelsStatusLabelMap,
  MyModelsStatusValueMap
} from '../config';
import type { ListItem } from '../config/types';
import { isSchedulePaused, isWaitingForSchedule } from './deployment-lifecycle';

export function getDeploymentStatus(
  model: ListItem,
  intl: ReturnType<typeof useIntl>,
  ready = modelReplicaCounts(model).ready
) {
  const paused = isSchedulePaused(model);
  const waiting = isWaitingForSchedule(model);
  if (paused || waiting || (!model.replicas && ready === 0)) {
    const text = intl.formatMessage({
      id: paused
        ? 'models.scaling.paused'
        : waiting
          ? 'models.scaling.waiting'
          : MyModelsStatusLabelMap[MyModelsStatusValueMap.Stopped]
    });
    return {
      inactive: true,
      status: StatusMaps.inactive,
      text,
      message: paused || waiting ? text : ''
    };
  }

  // The backend state can be absent until the first reconciliation.
  const state =
    model.state ||
    (ready > 0 ? ModelStateValueMap.Running : ModelStateValueMap.Pending);
  return {
    inactive: false,
    status: ModelStateMap[state] || StatusMaps.inactive,
    text: ModelStateLabelMap[state]
      ? intl.formatMessage({ id: ModelStateLabelMap[state] })
      : state,
    message:
      model.state_message ||
      (state === ModelStateValueMap.Pending && ready === 0
        ? intl.formatMessage({ id: 'models.state.pending.noReadyInstances' })
        : '')
  };
}
