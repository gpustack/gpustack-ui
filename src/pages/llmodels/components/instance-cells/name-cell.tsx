import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import { convertFileSize } from '@/utils';
import {
  HddFilled,
  InfoCircleOutlined,
  PieChartFilled,
  ThunderboltFilled
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import { ModelInstanceListItem } from '../../config/types';
import '../../style/instance-item.less';

interface NameCellProps {
  record: ModelInstanceListItem;
  modelData: any;
  defaultOpenId?: string;
}

const calcTotalVram = (vram: Record<string, number>) => {
  return _.sum(_.values(vram));
};

const WorkerInfoContent: React.FC<NameCellProps> = ({ record, modelData }) => {
  const intl = useIntl();
  let workerIp = '-';
  if (record.worker_ip) {
    workerIp = record.port
      ? `${record.worker_ip}:${record.port}`
      : record.worker_ip;
  }
  return (
    <div>
      <div>{record.worker_name}</div>
      <div className="flex-center">
        <HddFilled className="m-r-5" />
        {workerIp}
      </div>
      <div className="flex-center">
        <IconFont type="icon-filled-gpu" className="m-r-5" />
        {intl.formatMessage({ id: 'models.table.gpuindex' })}: [
        {_.join(
          record.gpu_indexes?.sort?.((a, b) => a - b),
          ','
        )}
        ]
      </div>
      <div className="flex-center">
        <ThunderboltFilled className="m-r-5" />
        {intl.formatMessage({ id: 'models.form.backend' })}:{' '}
        {record?.backend || modelData?.backend || ''}
        {record.backend_version || modelData?.backend_version
          ? `(${record.backend_version || modelData?.backend_version})`
          : ''}
      </div>
      <div className="flex-center">
        <PieChartFilled className="m-r-5" />
        {intl.formatMessage({ id: 'models.table.vram.allocated' })}:{' '}
        {convertFileSize(
          record.computed_resource_claim?.vram
            ? calcTotalVram(record.computed_resource_claim?.vram)
            : 0,
          1
        )}
      </div>
    </div>
  );
};

const WorkerInfo = (props: {
  title: React.ReactNode;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = React.useState(props.defaultOpen);

  useEffect(() => {
    if (props.defaultOpen) {
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    }
  }, [props.defaultOpen]);

  return (
    <span className="server-info-wrapper">
      <Tooltip
        open={open}
        onOpenChange={setOpen}
        title={props.title}
        styles={{
          container: {
            width: 'max-content',
            maxWidth: '400px'
          }
        }}
      >
        <span className="server-info">
          <InfoCircleOutlined />
        </span>
      </Tooltip>
    </span>
  );
};

const NameCell: React.FC<NameCellProps> = ({
  record,
  modelData,
  defaultOpenId
}) => {
  return (
    <span className="flex-center instance-name">
      <AutoTooltip title={record.name} ghost>
        <span className="m-r-5">{record.name}</span>
      </AutoTooltip>
      {!!record.worker_id && (
        <WorkerInfo
          title={
            <WorkerInfoContent
              record={record}
              modelData={modelData}
            ></WorkerInfoContent>
          }
          defaultOpen={defaultOpenId === record.name}
        ></WorkerInfo>
      )}
    </span>
  );
};

export default NameCell;
