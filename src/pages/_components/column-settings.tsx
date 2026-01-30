import OverlayScroller from '@/components/overlay-scroller';
import { SettingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Col, Popover, Row, Tooltip } from 'antd';
import React from 'react';
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

const ColumnSettings: React.FC<{
  contentHeight: number;
  columns: {
    title: string;
    dataIndex?: string;
    children?: { title: string; dataIndex?: string }[];
  }[];
  selectedColumns?: string[];
  grouped?: boolean;
  onChange?: (selectedColumns: string[]) => void;
}> = (props) => {
  const intl = useIntl();
  const { contentHeight, columns, selectedColumns, grouped, onChange } = props;
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => {
    setOpen(!open);
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
      onChange?.(allCols);
    } else {
      const allCols = columns
        .map((col) => col.dataIndex)
        .filter((dataIndex): dataIndex is string => Boolean(dataIndex));
      onChange?.(allCols);
    }
  };

  const handleConfirm = () => {
    setOpen(false);
  };

  const contentRender = () => {
    return (
      <Container>
        {!grouped && <div className="title">Column Settings</div>}
        <OverlayScroller
          maxHeight={contentHeight}
          styles={{
            wrapper: {
              paddingInlineStart: 0
            }
          }}
        >
          <Checkbox.Group
            value={selectedColumns}
            onChange={(checkedValues) => {
              onChange?.(checkedValues as string[]);
            }}
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
                            value={col.dataIndex}
                            style={{ marginBottom: 8 }}
                          >
                            <span className="text-secondary">{col.title}</span>
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
                        value={col.dataIndex}
                        style={{ marginBottom: 8 }}
                      >
                        <span className="text-secondary">{col.title}</span>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              )}
            </>
          </Checkbox.Group>
        </OverlayScroller>

        <div className="btn-wrapper">
          <Button
            size="middle"
            onClick={() => {
              onChange?.([]);
            }}
          >
            Reset
          </Button>
          <div className="buttons">
            <Button size="middle" type="primary" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="middle" type="primary" onClick={handleConfirm}>
              Confirm
            </Button>
          </div>
        </div>
      </Container>
    );
  };

  return (
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
};

export default ColumnSettings;
