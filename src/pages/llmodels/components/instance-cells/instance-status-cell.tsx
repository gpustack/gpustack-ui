import { StatusMaps } from '@/config';
import { StatusTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import {
  InstanceDrainingLabel,
  InstanceStatusMap,
  InstanceStatusMapValue,
  status
} from '../../config';
import { ModelInstanceListItem } from '../../config/types';

interface InstanceStatusProps {
  record: ModelInstanceListItem;
  onSelect: (val: string, record: ModelInstanceListItem) => void;
}

const InstanceStatusTag: React.FC<InstanceStatusProps> = ({
  record,
  onSelect
}) => {
  const intl = useIntl();
  if (!record.state) {
    return null;
  }

  /**
   * A member scale-down picked, waiting out its drain window.
   *
   * 🔴 Ahead of `state`, not derived from it: the member is still `running`
   * and the server means it — it is answering the decodes already pulling KV
   * from it, which is the entire reason it was not deleted outright. Rendered
   * from `state` alone it is a row that says «Running» for the window and then
   * disappears without a word, which is what «the scale-down did nothing» is
   * made of.
   *
   * 🔴 **But only when it really is running.** «Draining» claims one specific
   * thing — out of the registry, still serving what it already took — and a
   * member that is ERROR or still starting is doing neither. Overriding its
   * state anyway hides the more useful fact behind the less useful one, and
   * takes the role's counts with it: `ready` counts RUNNING members, so a
   * broken member shown as «Draining» is a row the reader can see and cannot
   * find in the «2 / 1» above it. Victim selection deliberately picks the
   * broken member first (`StatusScorer` scores it zero), so this is the
   * ordinary case, not a corner.
   *
   * Warning-coloured to match the role's dot in the replica column, so the
   * collapsed row and the expanded one point at the same thing in the same
   * colour.
   *
   * The label is English like every other one in this column; the explanation
   * under it is the UI's own copy and is translated, the same split the rest
   * of the page uses. It says what the state means, not how long is left: the
   * window is a server-side env var
   * (`GPUSTACK_SCHEDULER_DRAIN_WINDOW_SECONDS`) that nothing exposes, so a
   * countdown here would be a number the UI made up.
   */
  if (record.draining_since && record.state === InstanceStatusMap.Running) {
    return (
      <StatusTag
        statusValue={{
          status: StatusMaps.warning,
          text: InstanceDrainingLabel,
          message: intl.formatMessage({ id: 'models.instance.draining.tips' })
        }}
      />
    );
  }

  return (
    <StatusTag
      download={
        record.state === InstanceStatusMap.Downloading
          ? { percent: record.download_progress }
          : undefined
      }
      extra={
        record.state === InstanceStatusMap.Error && record.worker_id ? (
          <Button
            type="link"
            size="small"
            style={{ paddingLeft: 0 }}
            onClick={() => onSelect('viewlog', record)}
          >
            {intl.formatMessage({ id: 'models.list.more.logs' })}
          </Button>
        ) : null
      }
      statusValue={{
        status:
          record.state === InstanceStatusMap.Downloading &&
          record.download_progress === 100
            ? status[InstanceStatusMap.Running]
            : status[record.state],
        text: InstanceStatusMapValue[record.state],
        message:
          record.state === InstanceStatusMap.Downloading &&
          record.download_progress === 100
            ? ''
            : record.state_message
      }}
    />
  );
};

export default InstanceStatusTag;
