import StatusTag from '@/components/status-tag';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import {
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
