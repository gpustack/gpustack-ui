import IconFont from '@/components/icon-font';
import { RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox } from 'antd';
import _ from 'lodash';
import React from 'react';

interface HeaderPrefixProps {
  expandable?: boolean | React.ReactNode;
  enableSelection?: boolean;
  onSelectAll?: (e: any) => void;
  onExpandAll?: (e: any) => void;
  expandAll?: boolean;
  indeterminate?: boolean;
  selectAll?: boolean;
  hasColumns?: boolean;
  disabled?: boolean;
}

const HeaderPrefix: React.FC<HeaderPrefixProps> = (props) => {
  const {
    hasColumns,
    expandable,
    enableSelection,
    onSelectAll,
    onExpandAll,
    indeterminate,
    selectAll,
    expandAll,
    disabled
  } = props;

  const intl = useIntl();

  const handleToggleExpand = () => {
    onExpandAll?.(!expandAll);
  };

  const handleUnCheckAll = () => {
    onSelectAll?.({
      target: {
        checked: false
      }
    });
  };

  if (!hasColumns) {
    return null;
  }
  if (expandable && enableSelection) {
    return (
      <div
        className="header-row-prefix-wrapper flex-center"
        style={{ paddingLeft: 16 }}
      >
        <span style={{ marginRight: 5 }}>
          {_.isBoolean(expandable) ? (
            <Button
              type="text"
              size="small"
              onClick={handleToggleExpand}
              style={{ paddingInline: 6 }}
            >
              {expandAll ? (
                <IconFont
                  type="icon-collapse_all"
                  className="font-size-16"
                ></IconFont>
              ) : (
                <IconFont
                  type="icon-uncollapse_all"
                  className="font-size-16"
                ></IconFont>
              )}
            </Button>
          ) : (
            expandable
          )}
        </span>
        <Checkbox
          onChange={onSelectAll}
          indeterminate={indeterminate}
          checked={selectAll}
          disabled={disabled}
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
      <div className="header-row-prefix-wrapper">
        {<Checkbox disabled={disabled}></Checkbox>}
      </div>
    );
  }
  return null;
};

export default HeaderPrefix;
