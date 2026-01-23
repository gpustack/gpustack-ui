import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import RowChildren from '@/components/seal-table/components/row-children';
import StatusTag from '@/components/status-tag';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { EndpointStatus, EndpointStatusLabelMap } from '../config';
import { AccessPointItem } from '../config/types';
const CellContent = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

interface ProviderModelProps {
  dataList: AccessPointItem[];
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
    icon: <IconFont type="icon-shield" />
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
  const intl = useIntl();
  return (
    <div style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}>
      <RowChildren>
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={6}>
            <CellContent
              style={{
                paddingInline: 'var(--ant-table-cell-padding-inline)'
              }}
            >
              <AutoTooltip ghost>{data.provider_model_name}</AutoTooltip>
            </CellContent>
          </Col>
          <Col span={3}>
            <CellContent>-</CellContent>
          </Col>
          <Col span={4}>
            <CellContent>
              {data.weight && (
                <AutoTooltip ghost>
                  {intl.formatMessage({ id: 'accesses.form.endpoint.weight' })}:{' '}
                  {data.weight}
                </AutoTooltip>
              )}

              {data.fallback_status_codes &&
                data.fallback_status_codes?.length > 0 && (
                  <>
                    <span style={{ marginInline: 8 }}>/</span>
                    <span>
                      {intl.formatMessage({
                        id: 'accesses.table.label.fallback'
                      })}
                    </span>
                  </>
                )}
            </CellContent>
          </Col>
          <Col span={3}>
            <CellContent>
              <AutoTooltip ghost>
                <StatusTag
                  statusValue={{
                    status: EndpointStatus[data.state],
                    text: EndpointStatusLabelMap[data.state],
                    message: ''
                  }}
                />
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={5}>
            <CellContent style={{ marginLeft: -6 }}>
              <AutoTooltip ghost minWidth={20}>
                {dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={3}>
            <CellContent
              style={{
                marginLeft: -12
              }}
            >
              <DropdownButtons
                items={childActionList}
                onSelect={(val) => onSelect(val, data)}
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
      {dataList.map((item, index) => (
        <AccessItem data={item} key={index} onSelect={onSelect}></AccessItem>
      ))}
    </div>
  );
};

export default AccessPoints;
