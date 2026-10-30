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

  // Managed stop requests retain the instance until every workload stops.
  if (
    record.draining_since &&
    (record.state === InstanceStatusMap.Running ||
      (record.distributed_servers?.workloads != null &&
        record.state !== InstanceStatusMap.Error))
  ) {
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
