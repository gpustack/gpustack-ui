import OverlayScroller from '@/components/overlay-scroller';
import {
  readColumnSettings,
  writeColumnSettings
} from '@/utils/localstore/index';
import { SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Col, Popover, Row, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 8px 12px;
  padding-right: 4px;
  .title {
    font-weight: 500;
    margin-bottom: 12px;
  }
  .btn-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

const Title = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  margin-top: 4px;
`;

const LabelWrapper = styled.span`
  color: var(--color-text-secondary);
  > span {
    display: flex;
    align-items: center;
    gap: 4px;
    .sub-title {
      display: none;
    }
  }
`;

const ColumnSettings: React.FC<{
  width?: number;
  fixedColumns?: string[];
  tableName: string;
  contentHeight: number;
  columns: {
    title: React.ReactNode;
    dataIndex?: string;
    children?: { title: React.ReactNode; dataIndex?: string }[];
  }[];
  selectedColumns?: string[];
  defaultSelectedColumns?: string[];
  grouped?: boolean;
  onReset?: () => void;
  onChange?: (selectedColumns: string[]) => void;
}> = (props) => {
  const intl = useIntl();
  const {
    tableName,
    contentHeight,
    width = 420,
    columns,
    selectedColumns,
    defaultSelectedColumns,
    grouped,
    onReset,
    onChange,
    fixedColumns
  } = props;
  const [open, setOpen] = React.useState(false);
  const [innerSelectedColumns, setInnerSelectedColumns] = React.useState<
    string[]
  >(defaultSelectedColumns || []);

  React.useEffect(() => {
    if (open) {
      setInnerSelectedColumns(selectedColumns ?? defaultSelectedColumns ?? []);
    }
  }, [open, selectedColumns, defaultSelectedColumns]);

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleDraftChange = (columns: string[]) => {
    setInnerSelectedColumns(columns);
  };

  const handleSelectAll = () => {
    if (grouped) {
      const allCols: string[] = [];
      columns.forEach((group) => {
        group.children?.forEach((col) => {
          if (col.dataIndex) {
            allCols.push(col.dataIndex);
          }
        });
      });
      handleDraftChange(allCols);
    } else {
      const allCols = columns
        .map((col) => col.dataIndex)
        .filter((dataIndex): dataIndex is string => Boolean(dataIndex));
      handleDraftChange(allCols);
    }
  };

  const handleConfirm = () => {
    setOpen(false);
    writeColumnSettings(tableName, innerSelectedColumns);
    onChange?.(innerSelectedColumns);
  };

  const handleReset = () => {
    const resetCols = defaultSelectedColumns ?? [];
    writeColumnSettings(tableName, resetCols);
    onChange?.(resetCols);
    setInnerSelectedColumns(resetCols);
    onReset?.();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  useEffect(() => {
    const initColumns = async () => {
      const stored = await readColumnSettings(tableName);
      if (stored && stored.length > 0) {
        setInnerSelectedColumns(stored);
        onChange?.(stored);
      } else {
        setInnerSelectedColumns(defaultSelectedColumns || []);
      }
    };
    initColumns();
  }, []);

  const contentRender = () => {
    return (
      <Container>
        {!grouped && (
          <div className="title">
            {intl.formatMessage({ id: 'benchmark.table.columnSettings' })}
          </div>
        )}
        <OverlayScroller
          maxHeight={contentHeight}
          styles={{
            wrapper: {
              paddingInlineStart: 0
            }
          }}
        >
          <Checkbox.Group
            value={innerSelectedColumns}
            onChange={handleDraftChange}
          >
            <>
              {grouped ? (
                columns.map((row, index) => (
                  <div key={index}>
                    <Title>{row.title}</Title>
                    <Row>
                      {row.children?.map((col) => (
                        <Col key={col.dataIndex} span={12}>
                          <Checkbox
                            disabled={fixedColumns?.includes(
                              col.dataIndex || ''
                            )}
                            value={col.dataIndex}
                            style={{ marginBottom: 8 }}
                          >
                            <LabelWrapper>{col.title}</LabelWrapper>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))
              ) : (
                <Row>
                  {columns.map((col) => (
                    <Col key={col.dataIndex} span={12}>
                      <Checkbox
                        disabled={fixedColumns?.includes(col.dataIndex || '')}
                        value={col.dataIndex}
                        style={{ marginBottom: 8 }}
                      >
                        <LabelWrapper>{col.title}</LabelWrapper>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          </Checkbox.Group>
        </OverlayScroller>

        <div className="btn-wrapper">
          <Button size="middle" onClick={handleReset}>
            {intl.formatMessage({ id: 'common.button.resetdefault' })}
          </Button>
          <div className="buttons">
            <Button size="middle" type="primary" onClick={handleSelectAll}>
              {intl.formatMessage({ id: 'common.checkbox.all' })}
            </Button>
            <Button size="middle" type="primary" onClick={handleConfirm}>
              {intl.formatMessage({ id: 'common.button.save' })}
            </Button>
          </div>
        </div>
      </Container>
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger={'click'}
      arrow={false}
      placement="bottomRight"
      content={contentRender()}
      styles={{
        root: {
          width: width
        }
      }}
    >
      <Tooltip
        title={intl.formatMessage({ id: 'benchmark.table.columnSettings' })}
      >
        <Button onClick={handleToggle} icon={<SettingOutlined />}></Button>
      </Tooltip>
    </Popover>
  );
};

export default ColumnSettings;
