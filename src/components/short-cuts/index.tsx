import { platformCall } from '@/utils';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Tag } from 'antd';
import _ from 'lodash';
import React from 'react';
import IconFont from '../icon-font';
import './index.less';

const dataSource = [
  {
    scope: 'playground',
    command: 'New Message',
    keybindingWin: 'Ctrl + N',
    keybindingMac: 'N'
  },
  {
    scope: 'models',
    span: {
      rowSpan: 3,
      colSpan: 1
    },
    command: 'deploy model from Hugging Face',
    keybindingWin: 'Ctrl + 1',
    keybindingMac: '1'
  },
  {
    scope: 'models',
    command: 'deploy model from Ollama Library',
    keybindingWin: 'Ctrl + 2',
    keybindingMac: '2',
    span: {
      rowSpan: 0,
      colSpan: 0
    }
  },
  {
    scope: 'models',
    command: '从 Hugging Face 搜索模型',
    keybindingWin: 'Ctrl + K',
    keybindingMac: 'K',
    span: {
      rowSpan: 0,
      colSpan: 0
    }
  }
];

const ShortCuts: React.FC<{ intl: any }> = ({ intl }) => {
  const platform = platformCall();

  const [dataList, setDataList] = React.useState<any[]>(dataSource);

  const columns = [
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      onCell: (row: any, index: number) => {
        if (row.span) {
          return row.span;
        }
        return {
          rowSpan: 1,
          colSpan: 1
        };
      }
    },
    {
      title: 'Command',
      dataIndex: 'command',
      key: 'command'
    },
    {
      title: 'Keybinding',
      dataIndex: 'keybinding',
      key: 'keybinding',
      width: 180,
      render: (text: string, row: any) => {
        if (platform.isMac) {
          return (
            <Tag>
              <IconFont type="icon-command"></IconFont> + {row.keybindingMac}
            </Tag>
          );
        }
        return <Tag>{row.keybindingWin}</Tag>;
      }
    }
  ];

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    const list = _.filter(dataSource, (item: any) => {
      return (
        item.command.toLowerCase().includes(value.toLowerCase()) ||
        item.scope.toLowerCase().includes(value.toLowerCase())
      );
    });
    setDataList(list);
  };

  const debounceHandleInputChange = _.debounce(handleInputChange, 300);
  return (
    <div className="short-cuts">
      <h3 style={{ marginBottom: 20 }}>GPUStack 快捷方式</h3>
      <Input
        allowClear
        placeholder="Search keybindings"
        style={{ marginBottom: 16 }}
        onChange={debounceHandleInputChange}
        prefix={
          <>
            <SearchOutlined
              style={{
                fontSize: '16px',
                color: 'var(--ant-color-text-quaternary)'
              }}
            />
          </>
        }
      ></Input>
      <Table
        rowKey={(record) => record.command}
        columns={columns}
        dataSource={dataList}
        pagination={false}
      ></Table>
    </div>
  );
};

export const modalConfig = {
  icon: null,
  centered: false,
  maskClosable: true,
  footer: null,
  style: {
    top: '10%'
  },
  width: 660
};

export default React.memo(ShortCuts);
