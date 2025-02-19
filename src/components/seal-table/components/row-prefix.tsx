import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Checkbox } from 'antd';
import _ from 'lodash';
import React from 'react';

interface RowPrefixProps {
  expandable?: boolean | React.ReactNode;
  enableSelection?: boolean;
  expanded?: boolean;
  checked?: boolean;
  handleRowExpand?: () => void;
  handleSelectChange?: (e: any) => void;
}

const RowPrefix: React.FC<RowPrefixProps> = (props) => {
  const {
    expandable,
    enableSelection,
    expanded,
    checked,
    handleRowExpand,
    handleSelectChange
  } = props;

  if (expandable && enableSelection) {
    return (
      <div className="row-prefix-wrapper">
        <span style={{ marginRight: 5 }}>
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleRowExpand}>
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </Button>
          ) : (
            expandable
          )}
        </span>
        <Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>
      </div>
    );
  }
  if (expandable) {
    return (
      <div className="row-prefix-wrapper">
        {_.isBoolean(expandable) ? (
          <Button type="text" size="small" onClick={handleRowExpand}>
            {expanded ? <DownOutlined /> : <RightOutlined />}
          </Button>
        ) : (
          expandable
        )}
      </div>
    );
  }
  if (enableSelection) {
    return (
      <div className="row-prefix-wrapper">
        {<Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>}
      </div>
    );
  }
  return null;
};

export default RowPrefix;
