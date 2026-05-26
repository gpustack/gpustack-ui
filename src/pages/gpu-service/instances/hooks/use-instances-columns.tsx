import { ExportOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  CopyButton,
  DropdownButtons,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Fragment, useMemo } from 'react';
import { InstanceStatusLabelMap, rowActionList, status } from '../config';
import { ListItem } from '../config/types';
import tableSyles from '../styles/table.module.less';

type ConnectEntry =
  | {
      type: 'ssh';
      key: string;
      command: string;
      name: string;
      protocol: string;
    }
  | {
      type: 'http';
      key: string;
      port: number;
      url: string;
      name: string;
      protocol: string;
    };

const getConnectEntries = (record: ListItem): ConnectEntry[] => {
  const ip = record.status?.hostIPs?.[0]?.ip;
  const ports = record.status?.ports || [];
  const hasSshKey = !!record.spec?.sshPublicKeys?.length;
  const configPorts = record.spec?.ports || [];

  if (!ip) {
    return [];
  }

  return ports
    .filter((p) => p.nodePort)
    .map<ConnectEntry>((p) => {
      const isSsh = hasSshKey && p.protocol === 'TCP' && p.port === 22;
      return isSsh
        ? {
            type: 'ssh',
            name: 'SSH',
            key: `ssh-${p.nodePort}`,
            protocol: _.toUpper(p.protocol),
            command: `ssh root@${ip} -p ${p.nodePort}`
          }
        : {
            type: 'http',
            name:
              configPorts.find((port) => port.port === p.port)?.name ||
              _.toUpper(p.protocol),
            key: `http-${p.nodePort}`,
            port: p.port,
            protocol: _.toUpper(p.protocol),
            url: `http://${ip}:${p.nodePort}`
          };
    });
};

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
}

const useInstancesColumns = ({
  handleSelect,
  sortOrder
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();

  const renderInstanceType = (record: ListItem) => {
    const description = JSON.parse(record?.description || '{}').spec || {};
    return (
      <Flex align="flex-start" orientation="vertical">
        <span className="text-primary">
          {description.acceleratable
            ? `${description.product} x ${record.spec?.resources?.accelerator}`
            : 'CPU'}
        </span>
        <Flex
          align="center"
          style={{ fontSize: 13, color: 'var(--ant-color-text-tertiary)' }}
        >
          <span>{record.spec.resources?.cpu}C</span>
          <span className={tableSyles.dot} />
          <span>
            {intl.formatMessage({ id: 'gpuservice.instance.ram' })}:{' '}
            {record.spec.resources?.ram?.replace('Gi', 'GB')}
          </span>
          <span className={tableSyles.dot} />
          <span>
            {intl.formatMessage({ id: 'gpuservice.instance.disk' })}:{' '}
            {record.spec.resources?.localStorage?.replace('Gi', 'GB')}
          </span>
        </Flex>
      </Flex>
    );
  };

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <AutoTooltip ghost style={{ maxWidth: 360 }}>
            <span className="text-primary">{text || record.displayName}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.connect' }),
        key: 'connect',
        ellipsis: {
          showTitle: false
        },
        render: (_text, record: ListItem) => {
          const entries = getConnectEntries(record);

          if (entries.length === 0) {
            return '-';
          }

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'max-content max-content',
                rowGap: 6,
                columnGap: 8,
                alignItems: 'center'
              }}
            >
              {entries.map((entry) => (
                <Fragment key={entry.key}>
                  <span
                    className="text-tertiary"
                    style={{
                      fontSize: 12,
                      maxWidth: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {entry.type === 'ssh'
                      ? 'SSH'
                      : entry.name || entry.protocol}
                  </span>
                  {entry.type === 'ssh' ? (
                    <CopyButton
                      text={entry.command}
                      type="link"
                      size="small"
                      tips={intl.formatMessage({
                        id: 'gpuservice.instance.connect.copySshCommand'
                      })}
                      style={{
                        padding: '0 6px',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 4,
                        backgroundColor: 'var(--ant-color-fill-tertiary)',
                        fontSize: 12
                      }}
                    />
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0 6px',
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--ant-color-fill-tertiary)'
                      }}
                    >
                      <span>{entry.port}</span>
                      <ExportOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                    </Button>
                  )}
                </Fragment>
              ))}
            </div>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (value: string, record: ListItem) => {
          return (
            <StatusTag
              statusValue={{
                status: status[value],
                text: InstanceStatusLabelMap[value] || value,
                message: record?.status?.phaseMessage || ''
              }}
            ></StatusTag>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.section.type' }),
        dataIndex: ['spec', 'type'],
        key: 'type',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (_text: string, record: ListItem) => (
          <div style={{ width: 'max-content' }}>
            <AutoTooltip ghost>{renderInstanceType(record)}</AutoTooltip>
          </div>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost>
            {text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        ellipsis: {
          showTitle: false
        },
        render: (_text, record) => (
          <DropdownButtons
            items={rowActionList}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, sortOrder, intl]);
};

export default useInstancesColumns;
