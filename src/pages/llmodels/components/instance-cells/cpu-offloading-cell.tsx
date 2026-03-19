import InfoColumn from '@/components/simple-table/info-column';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ModelInstanceListItem } from '../../config/types';

const fieldList = [
  {
    label: 'CPU',
    key: 'cpuoffload',
    locale: false
  },
  {
    label: 'GPU',
    key: 'gpuoffload',
    locale: false
  }
];

interface CPUOffloadingCellProps {
  record: ModelInstanceListItem;
}
const CPUOffloadingCell: React.FC<CPUOffloadingCellProps> = ({ record }) => {
  const intl = useIntl();
  const { total_layers, offload_layers } =
    record?.computed_resource_claim || {};

  if (total_layers === offload_layers || !total_layers) {
    return null;
  }

  const offloadData = {
    cpuoffload: `${
      _.subtract(total_layers, offload_layers) || 0
    } ${intl.formatMessage({
      id: 'models.table.layers'
    })}`,
    gpuoffload: `${offload_layers} ${intl.formatMessage({
      id: 'models.table.layers'
    })}`
  };

  return (
    <Tooltip
      styles={{
        container: {
          paddingInline: 12
        }
      }}
      title={<InfoColumn fieldList={fieldList} data={offloadData}></InfoColumn>}
    >
      <span>
        <ThemeTag
          opacity={0.75}
          color="cyan"
          style={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            minWidth: 50,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            borderRadius: 12
          }}
        >
          <InfoCircleOutlined className="m-r-5" />
          {intl.formatMessage({
            id: 'models.table.cpuoffload'
          })}
        </ThemeTag>
      </span>
    </Tooltip>
  );
};

export default CPUOffloadingCell;
