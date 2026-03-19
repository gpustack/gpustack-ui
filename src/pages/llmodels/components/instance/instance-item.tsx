import AutoTooltip from '@/components/auto-tooltip';
import RowChildren from '@/components/seal-table/components/row-children';
import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';
import '../../style/instance-item.less';
import ActionsCell from '../instance-cells/actions-cell';
import CPUOffloadingCell from '../instance-cells/cpu-offloading-cell';
import DistributeInfoCell from '../instance-cells/distribute-info-cell';
import DownloadingStatusCell from '../instance-cells/downloading-status-cell';
import InstanceStatusCell from '../instance-cells/instance-status-cell';
import NameCell from '../instance-cells/name-cell';

interface InstanceItemProps {
  instanceData: ModelInstanceListItem;
  workerList: WorkerListItem[];
  modelData?: any;
  defaultOpenId: string;
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const InstanceItem: React.FC<InstanceItemProps> = ({
  instanceData,
  workerList,
  modelData,
  defaultOpenId,
  handleChildSelect
}) => {
  return (
    <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
      <RowChildren>
        <Row style={{ width: '100%' }} align="middle">
          <Col
            span={6}
            style={{
              paddingInline: 'var(--ant-table-cell-padding-inline)'
            }}
          >
            <NameCell
              record={instanceData}
              modelData={modelData}
              defaultOpenId={defaultOpenId}
            ></NameCell>
          </Col>
          <Col span={7}>
            <span
              style={{
                paddingLeft: '58px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
              className="flex align-center"
            >
              <CPUOffloadingCell record={instanceData}></CPUOffloadingCell>
              <DistributeInfoCell
                record={instanceData}
                workerList={workerList}
              ></DistributeInfoCell>
            </span>
          </Col>
          <Col span={4}>
            <span
              style={{ paddingLeft: '40px', gap: 4 }}
              className="flex-center"
            >
              <InstanceStatusCell
                record={instanceData}
                onSelect={handleChildSelect}
              />
              <DownloadingStatusCell
                backend={modelData?.backend}
                distributed_servers={instanceData.distributed_servers}
                workerList={workerList}
                record={instanceData}
              ></DownloadingStatusCell>
            </span>
          </Col>
          <Col span={4}>
            <span style={{ paddingLeft: 43 }} className="flex">
              <AutoTooltip ghost>
                {dayjs(instanceData.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </AutoTooltip>
            </span>
          </Col>
          <Col span={3}>
            <div style={{ paddingLeft: 36 }}>
              <ActionsCell
                record={instanceData}
                modelData={modelData}
                onSelect={handleChildSelect}
              ></ActionsCell>
            </div>
          </Col>
        </Row>
      </RowChildren>
    </div>
  );
};
export default InstanceItem;
