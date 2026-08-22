import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import React, { useEffect, useState } from 'react';
import { queryCacheServiceModels } from '../apis';
import { CacheServiceModelItem } from '../config/types';
import SubTitle from './sub-title';

const ServiceDeployments: React.FC<{ serviceId: number }> = ({ serviceId }) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState<CacheServiceModelItem[]>([]);

  useEffect(() => {
    if (!serviceId) {
      setDataList([]);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchModels = async () => {
      setLoading(true);
      try {
        const res = await queryCacheServiceModels(serviceId);
        if (active) {
          setDataList(res?.items || []);
        }
      } catch (error) {
        if (active) {
          setDataList([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchModels();
    return () => {
      active = false;
    };
  }, [serviceId]);

  const columns = [
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name',
      render: (text: string) => (
        <AutoTooltip ghost minWidth={20}>
          {text}
        </AutoTooltip>
      )
    },
    {
      title: intl.formatMessage({ id: 'models.form.replicas' }),
      dataIndex: 'replicas'
    },
    {
      title: intl.formatMessage({ id: 'models.form.backend' }),
      dataIndex: 'backend'
    }
  ];

  return (
    <div>
      <SubTitle>
        {intl.formatMessage({ id: 'kvCache.detail.deployments' })}
      </SubTitle>
      <Table
        rowKey="id"
        tableLayout="fixed"
        columns={columns}
        dataSource={dataList}
        loading={loading}
        pagination={false}
      ></Table>
    </div>
  );
};

export default ServiceDeployments;
