import DropdownButtons from '@/components/drop-down-buttons';
import RowChildren from '@/components/seal-table/components/row-children';
import StatusTag from '@/components/status-tag';
import { DeleteOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Row, Space } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import React from 'react';
import { InstanceStatusMap, status } from '../config';
import { ModelInstanceListItem } from '../config/types';

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  handleChildSelect: (
    val: string,
    item: ModelInstanceListItem,
    list: ModelInstanceListItem[]
  ) => void;
}

const InstanceItem: React.FC<InstanceItemProps> = ({
  list,
  handleChildSelect
}) => {
  console.log('instance item====');
  const intl = useIntl();
  const childActionList = [
    {
      label: intl.formatMessage({ id: 'common.button.viewlog' }),
      key: 'viewlog',
      status: [
        InstanceStatusMap.Running,
        InstanceStatusMap.Error,
        InstanceStatusMap.Downloading
      ],
      icon: <FieldTimeOutlined />
    },
    {
      label: intl.formatMessage({ id: 'common.button.delete' }),
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />
    }
  ];

  const setChildActionList = (item: ModelInstanceListItem) => {
    return _.filter(childActionList, (action: any) => {
      if (action.key === 'viewlog') {
        return action.status.includes(item.state);
      }
      return true;
    });
  };

  const getWorkerIp = (item: ModelInstanceListItem) => {
    if (item.worker_ip) {
      return item.port ? `${item.worker_ip}:${item.port}` : item.worker_ip;
    }
    return '-';
  };
  return (
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
          <div
            key={`${item.id}`}
            style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}
          >
            <RowChildren key={`${item.id}_row`}>
              <Row style={{ width: '100%' }} align="middle">
                <Col span={4}>{item.name}</Col>
                <Col span={3}>{getWorkerIp(item)}</Col>
                <Col span={4}>
                  <span>
                    {item.source === 'huggingface'
                      ? item.huggingface_filename
                      : item.ollama_library_model_name}
                  </span>
                </Col>

                <Col span={3}>
                  <span
                    style={{ paddingLeft: '0px' }}
                    className="flex justify-center"
                  >
                    {item.state && (
                      <StatusTag
                        download={
                          item.state === InstanceStatusMap.Downloading
                            ? { percent: item.download_progress }
                            : undefined
                        }
                        statusValue={{
                          status: status[item.state] as any,
                          text: item.state
                        }}
                      ></StatusTag>
                    )}
                  </span>
                </Col>
                <Col span={5}>
                  <span style={{ paddingLeft: 36 }}>
                    {dayjs(item.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </Col>
                <Col span={5}>
                  <div style={{ paddingLeft: 39 }}>
                    <DropdownButtons
                      items={setChildActionList(item)}
                      onSelect={(val: string) =>
                        handleChildSelect(val, item, list)
                      }
                    ></DropdownButtons>
                  </div>
                </Col>
              </Row>
            </RowChildren>
          </div>
        );
      })}
    </Space>
  );
};
export default React.memo(InstanceItem);
