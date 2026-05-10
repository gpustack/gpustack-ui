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
import { useMemo } from 'react';
import { InstanceStatusLabelMap, rowActionList, status } from '../config';
import { ListItem } from '../config/types';

type ConnectEntry =
  | { type: 'ssh'; key: string; command: string }
  | { type: 'http'; key: string; port: number; url: string };

const getConnectEntries = (record: ListItem): ConnectEntry[] => {
  const ip = record.status?.hostIPs?.[0]?.ip;
  const ports = record.status?.ports || [];
  const hasSshKey = !!record.spec?.sshPublicKey?.name;

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
            key: `ssh-${p.nodePort}`,
            command: `ssh root@${ip} -p ${p.nodePort}`
          }
        : {
            type: 'http',
            key: `http-${p.nodePort}`,
            port: p.port,
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
  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: ['metadata', 'name'],
        key: 'name',
        sorter: false,
        ellipsis: {
          showTitle: false
        },
        render: (text: string) => (
          <AutoTooltip ghost style={{ maxWidth: 360 }}>
            <span className="text-primary">{text}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.connect' }),
        key: 'connect',
        render: (_text, record: ListItem) => {
          const entries = getConnectEntries(record);

          if (entries.length === 0) {
            return '-';
          }

          return (
            <Flex gap={6} vertical>
              {entries.map((entry) =>
                entry.type === 'ssh' ? (
                  <Flex key={entry.key} align="center" style={{ height: 22 }}>
                    <span
                      className="text-tertiary"
                      style={{ fontSize: 12, width: 34, flexShrink: 0 }}
                    >
                      SSH
                    </span>
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
                  </Flex>
                ) : (
                  <Flex key={entry.key} align="center" style={{ height: 22 }}>
                    <span
                      className="text-tertiary"
                      style={{ fontSize: 12, width: 34, flexShrink: 0 }}
                    >
                      HTTP
                    </span>
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
                      {entry.port}
                      <ExportOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                    </Button>
                  </Flex>
                )
              )}
            </Flex>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        sorter: false,
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
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: ['metadata', 'creationTimestamp'],
        key: 'creationTimestamp',
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
