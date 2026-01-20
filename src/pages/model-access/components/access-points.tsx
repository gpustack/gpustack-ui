import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import RowChildren from '@/components/seal-table/components/row-children';
import StatusTag from '@/components/status-tag';
import { DeleteOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { mockAccessPointList } from '../config/mock';

const CellContent = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

interface ProviderModelProps {
  dataList: any[];
  provider: string;
  providerId: number;
  onSelect: (val: any, record: any) => void;
}

interface AccessItemProps {
  onSelect: (val: any, record: any) => void;
  data: any;
}

export const childActionList = [
  {
    key: 'viewlog',
    label: 'common.button.viewlog',
    icon: <IconFont type="icon-logs" />
  },
  {
    key: 'fallback',
    label: 'accesses.table.setAsFallback',
    icon: <StarOutlined />
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

const AccessItem: React.FC<AccessItemProps> = ({ onSelect, data }) => {
  return (
    <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
      <RowChildren>
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={5}>
            <CellContent
              style={{
                paddingInline: 'var(--ant-table-cell-padding-inline)'
              }}
            >
              <AutoTooltip ghost>qwen3-0.6b-zduxy</AutoTooltip>
              {data.is_fallback && (
                <StarFilled
                  style={{ color: 'var(--ant-color-warning)', marginLeft: 8 }}
                />
              )}
            </CellContent>
          </Col>
          <Col span={5}>
            <CellContent style={{ paddingLeft: 44 }}>
              <AutoTooltip ghost>Traffic: 20%</AutoTooltip>
            </CellContent>
          </Col>
          <Col span={5}>
            <CellContent style={{ paddingLeft: 44 }}>
              <AutoTooltip ghost>
                <StatusTag
                  statusValue={{
                    status: 'success',
                    text: 'Ready',
                    message: ''
                  }}
                />
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={5}>
            <CellContent style={{ paddingLeft: 44 }}>
              <AutoTooltip ghost minWidth={20}>
                {dayjs().format('YYYY-MM-DD HH:mm:ss')}
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={3}>
            <CellContent style={{ paddingLeft: 36 }}>
              <DropdownButtons
                items={childActionList}
                onSelect={onSelect}
              ></DropdownButtons>
            </CellContent>
          </Col>
        </Row>
      </RowChildren>
    </div>
  );
};

const AccessPoints: React.FC<ProviderModelProps> = ({ dataList, onSelect }) => {
  console.log('AccessPoints dataList:', dataList);
  return (
    <div>
      {mockAccessPointList.map((item, index) => (
        <AccessItem data={item} key={index} onSelect={onSelect}></AccessItem>
      ))}
    </div>
  );
};

export default AccessPoints;
