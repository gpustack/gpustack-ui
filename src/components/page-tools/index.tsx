import DropDownActions from '@/components/drop-down-actions';
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space } from 'antd';
import React, { useMemo } from 'react';
import BaseSelect from '../seal-form/base/select';
import './index.less';

type PageToolsProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  style?: React.CSSProperties;
};

const PageTools: React.FC<PageToolsProps> = (props) => {
  const {
    left,
    right,
    marginBottom = 0,
    marginTop = 30,
    style: pageStyle
  } = props;

  const newStyle: React.CSSProperties = useMemo(() => {
    const style: React.CSSProperties = {};
    style.marginBottom = `${marginBottom}px`;
    style.marginTop = `${marginTop}px`;
    if (pageStyle) {
      Object.assign(style, pageStyle);
    }
    return style;
  }, [marginBottom, marginTop, pageStyle]);

  return (
    <div className="page-tools" style={newStyle}>
      <div className="left">{left}</div>
      <div className="right">{right}</div>
    </div>
  );
};

interface ActionItem {
  label: string;
  locale: boolean;
  value: string;
  key: string;
  icon: React.ReactNode;
  [key: string]: any;
}

interface FilterBarProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange?: (value: any) => void;
  handleSearch: () => void;
  handleDeleteByBatch?: () => void;
  handleClickPrimary?: (item: any) => void;
  rowSelection?: any;
  actionItems?: ActionItem[];
  selectOptions?: Global.BaseOption<string | number>[];
  showSelect?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  inputHolder?: string;
  selectHolder?: string;
  actionType?: 'dropdown' | 'button';
  showPrimaryButton?: boolean;
  showDeleteButton?: boolean;
  right?: React.ReactNode;
  left?: React.ReactNode;
  widths?: {
    input?: number;
    select?: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = (props) => {
  const {
    handleInputChange,
    handleSelectChange,
    handleSearch,
    handleDeleteByBatch = null,
    handleClickPrimary = null,
    rowSelection,
    actionItems = [],
    selectOptions,
    showSelect,
    buttonText,
    buttonIcon,
    actionType = 'button',
    marginBottom = 10,
    marginTop = 10,
    inputHolder,
    selectHolder,
    right,
    left,
    widths
  } = props;
  const intl = useIntl();

  const renderRight = useMemo(() => {
    if (!handleClickPrimary && !handleDeleteByBatch) {
      return null;
    }
    return (
      <Space size={20}>
        {handleClickPrimary ? (
          actionType === 'dropdown' ? (
            <DropDownActions
              menu={{
                items: actionItems,
                onClick: handleClickPrimary
              }}
            >
              <Button
                icon={<DownOutlined></DownOutlined>}
                type="primary"
                iconPlacement="end"
              >
                {buttonText}
              </Button>
            </DropDownActions>
          ) : (
            <Button
              icon={buttonIcon ?? <PlusOutlined></PlusOutlined>}
              type="primary"
              onClick={handleClickPrimary}
            >
              {buttonText}
            </Button>
          )
        ) : null}
        {handleDeleteByBatch && (
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleDeleteByBatch}
            disabled={!rowSelection?.selectedRowKeys?.length}
          >
            <span>
              {intl?.formatMessage?.({ id: 'common.button.delete' })}
              {rowSelection?.selectedRowKeys?.length > 0 && (
                <span>({rowSelection?.selectedRowKeys?.length})</span>
              )}
            </span>
          </Button>
        )}
      </Space>
    );
  }, [
    actionItems,
    actionType,
    rowSelection?.selectedRowKeys,
    handleClickPrimary,
    intl
  ]);

  return (
    <PageTools
      marginBottom={marginBottom}
      marginTop={0}
      left={
        <Space>
          <Input
            prefix={
              <SearchOutlined
                style={{ color: 'var(--ant-color-text-placeholder)' }}
              ></SearchOutlined>
            }
            placeholder={
              inputHolder ||
              intl.formatMessage({
                id: 'common.filter.name'
              })
            }
            style={{ width: widths?.input || 230 }}
            allowClear
            onChange={handleInputChange}
          ></Input>
          {showSelect && (
            <BaseSelect
              allowClear
              showSearch={false}
              placeholder={selectHolder}
              style={{ width: widths?.select || 230 }}
              size="large"
              onChange={handleSelectChange}
              options={selectOptions}
            ></BaseSelect>
          )}
          <Button
            type="text"
            style={{ color: 'var(--ant-color-text-tertiary)' }}
            onClick={handleSearch}
            icon={<SyncOutlined></SyncOutlined>}
          ></Button>
        </Space>
      }
      right={right || renderRight}
    ></PageTools>
  );
};

export default PageTools;
