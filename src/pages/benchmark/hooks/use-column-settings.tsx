import { SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Col, Popover, Row, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-height: 450px;
  overflow-y: auto;
  padding: 12px;
  .title {
    font-weight: 500;
    margin-bottom: 12px;
  }
  .btn-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--ant-color-split);
    padding-top: 12px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

const useColumnSettings = () => {
  const intl = useIntl();

  const [open, setOpen] = React.useState(false);
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);

  const handleToggle = () => {
    setOpen(!open);
  };

  const allColumns = [
    {
      title: intl.formatMessage({ id: 'clusters.title' }),
      dataIndex: 'cluster_id'
    },
    {
      title: intl.formatMessage({ id: 'resources.worker' }),
      dataIndex: 'worker_id'
    },
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.model' }),
      dataIndex: 'model_name'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.dataset' }),
      dataIndex: 'dataset_name'
    },
    {
      title: 'Latency',
      dataIndex: 'latency_mean'
    },
    {
      title: 'Throughput',
      dataIndex: 'throughput_mean'
    },
    {
      title: 'Throughput request',
      dataIndex: 'throughput_request_mean'
    },
    {
      title: 'generated tokens',
      dataIndex: 'generated_tokens_mean'
    },
    {
      title: 'ITL Avg',
      dataIndex: 'inter_token_latency_mean'
    },
    {
      title: intl.formatMessage({ id: 'common.table.status' }),
      dataIndex: 'state'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.requestRate' }),
      dataIndex: 'request_rate'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.gpu' }),
      dataIndex: 'gpu_summary'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.itl' }),
      dataIndex: 'inter_token_latency_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.tpot' }),
      dataIndex: 'time_per_output_token_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.ttft' }),
      dataIndex: 'time_to_first_token_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.rps' }),
      dataIndex: 'requests_per_second_mean'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.table.tps' }),
      dataIndex: 'tokens_per_second_mean'
    },
    {
      title: intl.formatMessage({ id: 'common.table.createTime' }),
      dataIndex: 'created_at'
    },
    {
      title: intl.formatMessage({ id: 'common.table.operation' }),
      dataIndex: 'operations'
    }
  ];

  const contentRender = () => {
    return (
      <Container>
        <div className="title">Column Settings</div>
        <Checkbox.Group
          value={selectedColumns}
          onChange={(checkedValues) => {
            setSelectedColumns(checkedValues as string[]);
          }}
        >
          <Row>
            {allColumns.map((col) => (
              <Col key={col.dataIndex} span={12}>
                <Checkbox value={col.dataIndex} style={{ marginBottom: 8 }}>
                  <span className="text-secondary">{col.title}</span>
                </Checkbox>
              </Col>
            ))}
          </Row>
        </Checkbox.Group>
        <div className="btn-wrapper">
          <Button
            size="middle"
            onClick={() => {
              setSelectedColumns([]);
            }}
          >
            Clear All
          </Button>
          <div className="buttons">
            <Button
              size="middle"
              type="primary"
              onClick={() => {
                setSelectedColumns(allColumns.map((col) => col.dataIndex));
              }}
            >
              Select All
            </Button>
            <Button
              size="middle"
              type="primary"
              onClick={() => {
                setSelectedColumns(allColumns.map((col) => col.dataIndex));
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Container>
    );
  };

  const SettingsButton = (
    <Popover
      trigger={'click'}
      arrow={false}
      placement="bottomRight"
      content={contentRender()}
      styles={{
        root: {
          width: '420px'
        }
      }}
    >
      <Tooltip title="Column Settings">
        <Button onClick={handleToggle} icon={<SettingOutlined />}></Button>
      </Tooltip>
    </Popover>
  );

  return {
    SettingsButton,
    selectedColumns
  };
};

export default useColumnSettings;
