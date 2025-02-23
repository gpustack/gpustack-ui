import { RightOutlined } from '@ant-design/icons';
import { Button, Checkbox } from 'antd';
import _ from 'lodash';
import React from 'react';

interface HeaderPrefixProps {
  expandable?: boolean | React.ReactNode;
  enableSelection?: boolean;
  onSelectAll?: (e: any) => void;
  indeterminate?: boolean;
  selectAll?: boolean;
  hasColumns?: boolean;
}

const HeaderPrefix: React.FC<HeaderPrefixProps> = (props) => {
  const {
    hasColumns,
    expandable,
    enableSelection,
    onSelectAll,
    indeterminate,
    selectAll
  } = props;
  if (!hasColumns) {
    return null;
  }
  if (expandable && enableSelection) {
    return (
      <div className="header-row-prefix-wrapper">
        <span style={{ marginRight: 5, padding: '0 14px' }}></span>
        <Checkbox
          onChange={onSelectAll}
          indeterminate={indeterminate}
          checked={selectAll}
        ></Checkbox>
      </div>
    );
  }
  if (expandable) {
    return (
      <div className="header-row-prefix-wrapper">
        {_.isBoolean(expandable) ? (
          <Button type="text" size="small">
            <RightOutlined />
          </Button>
        ) : (
          expandable
        )}
      </div>
    );
  }
  if (enableSelection) {
    return (
      <div className="header-row-prefix-wrapper">{<Checkbox></Checkbox>}</div>
    );
  }
  return null;
};

export default React.memo(HeaderPrefix);
