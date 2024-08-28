import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Tag } from 'antd';
import _ from 'lodash';
import React from 'react';
import './index.less';
import KeyMapConfig from './keymap';

const ShortCuts: React.FC<{ intl: any }> = ({ intl }) => {
  const [dataList, setDataList] = React.useState<any[]>(KeyMapConfig);

  const columns = [
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 160
    },
    {
      title: 'Action',
      dataIndex: 'command',
      key: 'command',
      render: (text: string, row: any) => {
        return <span>{intl.formatMessage({ id: text })}</span>;
      }
    },
    {
      title: 'Keybinding',
      dataIndex: 'keybinding',
      key: 'keybinding',
      width: 180,
      render: (text: string, row: any) => {
        return <Tag>{row.keybinding}</Tag>;
      }
    }
  ];

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    const list = _.filter(KeyMapConfig, (item: any) => {
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
      <h3 style={{ marginBottom: 20, fontWeight: 'var(--font-weight-bold)' }}>
        {intl.formatMessage({ id: 'shortcuts.title' })}
      </h3>
      <Input
        allowClear
        placeholder={intl.formatMessage({ id: 'shortcuts.search.placeholder' })}
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
        scroll={{ y: 450 }}
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
  width: 700
};

export default React.memo(ShortCuts);
