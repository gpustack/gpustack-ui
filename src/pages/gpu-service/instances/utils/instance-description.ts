import _ from 'lodash';
import { InstanceTypeItem } from '../config/types';

// Serialize the chosen instance type into the instance's `description` field —
// a persisted spec snapshot the form reads back to render the type card and
// derive unit resources. Shared by the create/recreate flow (card selection)
// and the edit flow (change-type overlay).
export const saveInstanceDataInDescription = (
  instanceType: InstanceTypeItem
): string => {
  return JSON.stringify({
    name: instanceType.name,
    spec: {
      ..._.omit(instanceType.spec, ['cache', 'cpu']),
      cpu: _.pick(instanceType.spec?.cpu, ['manufacturer', 'product', 'family'])
    }
  });
};
