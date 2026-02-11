import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import RowChildren from '@/components/seal-table/components/row-children';
import StatusTag from '@/components/status-tag';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import { TargetStatus, TargetStatusLabelMap } from '../config';
import { RouteTarget } from '../config/types';

const CellContent = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

interface ProviderModelProps {
  dataList: RouteTarget[];
  onSelect: (val: any, record: any) => void;
  sourceModels: any[];
  modelList?: Global.BaseOption<number>[];
}

interface TargetItemProps {
  onSelect: (val: any, record: any) => void;
  data: any;
  sourceModels: any[];
  modelList?: Global.BaseOption<number>[];
}

export const childActionList = [
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

const RouteItem: React.FC<TargetItemProps> = ({
  onSelect,
  data,
  sourceModels,
  modelList
}) => {
  const intl = useIntl();

  const renderProviderSource = () => {
    const model = sourceModels.find((item: any) => {
      if (data.model_id) {
        return item.value === 'deployments';
      }
      return item.value === data.provider_id;
    });
    if (!model) {
      return '-';
    }
    return (
      <span className="flex-center" style={{ gap: 8, width: '100%' }}>
        <ProviderLogo provider={model.providerType}></ProviderLogo>
        <AutoTooltip ghost minWidth={20}>
          {data.model_id
            ? modelList?.find((m) => m.value === data.model_id)?.label
            : data.provider_model_name}
        </AutoTooltip>
      </span>
    );
  };
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
              <AutoTooltip ghost>{data.name}</AutoTooltip>
            </CellContent>
          </Col>
          <Col span={5} style={{ paddingLeft: 64 }}>
            <CellContent>{renderProviderSource()}</CellContent>
          </Col>
          <Col span={2}>
            <CellContent>
              {data.weight > 0 && (
                <AutoTooltip ghost>
                  {intl.formatMessage({ id: 'routes.form.target.weight' })}:{' '}
                  {data.weight}
                </AutoTooltip>
              )}

              {data.fallback_status_codes &&
                data.fallback_status_codes?.length > 0 && (
                  <>
                    {data.weight > 0 && (
                      <span style={{ marginInline: 8 }}>/</span>
                    )}
                    <span>
                      {intl.formatMessage({
                        id: 'routes.table.label.fallback'
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
                    status: TargetStatus[data.state],
                    text: TargetStatusLabelMap[data.state],
                    message: ''
                  }}
                />
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={5}>
            <CellContent style={{ paddingLeft: 45 }}>
              <AutoTooltip ghost minWidth={20}>
                {dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </AutoTooltip>
            </CellContent>
          </Col>
          <Col span={4}>
            <CellContent
              style={{
                paddingLeft: 38
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

const RouteTargets: React.FC<ProviderModelProps> = ({
  dataList,
  onSelect,
  modelList,
  sourceModels
}) => {
  return (
    <div>
      {dataList.map((item, index) => (
        <RouteItem
          data={item}
          key={index}
          onSelect={onSelect}
          sourceModels={sourceModels}
          modelList={modelList}
        ></RouteItem>
      ))}
    </div>
  );
};

export default RouteTargets;
