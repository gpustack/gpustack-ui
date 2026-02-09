import OverlayScroller from '@/components/overlay-scroller';
import { FilterOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Popover } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 8px;
  padding-right: 0px;
  .title {
    font-weight: 500;
    margin-bottom: 12px;
  }
  .btn-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 24px;
    padding-right: 8px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

const FilterForm: React.FC<
  React.PropsWithChildren & {
    width?: number;
    contentHeight?: number;
    initialValues?: any;
    hasFilters?: boolean;
    onClose?: () => void;
    onValuesChange?: (ChangeValues: any, allValues: any) => void;
  }
> = ({
  children,
  width = 300,
  contentHeight = 400,
  initialValues = {},
  hasFilters = false,
  onClose,
  onValuesChange
}) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleOnReset = () => {
    form.resetFields(Object.keys(initialValues));
    onValuesChange?.({}, initialValues);
    setOpen(false);
  };

  const handleOnClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Popover
      open={open}
      trigger={'click'}
      arrow={false}
      placement="bottomRight"
      content={
        <Container>
          <OverlayScroller
            maxHeight={contentHeight}
            styles={{
              wrapper: {
                paddingInlineStart: 0
              }
            }}
          >
            <Form
              onValuesChange={onValuesChange}
              initialValues={initialValues}
              form={form}
            >
              {children}
            </Form>
          </OverlayScroller>
          <div className="btn-wrapper">
            <Button size="middle" onClick={handleOnReset}>
              {intl.formatMessage({ id: 'common.button.reset' })}
            </Button>
            <div className="buttons">
              <Button size="middle" type="primary" onClick={handleOnClose}>
                {intl.formatMessage({ id: 'common.button.close' })}
              </Button>
            </div>
          </div>
        </Container>
      }
      onOpenChange={handleOpenChange}
      styles={{
        container: {
          padding: 8
        },
        root: {
          width: width
        }
      }}
    >
      <Button onClick={handleToggle} icon={<FilterOutlined />}></Button>
    </Popover>
  );
};

export default FilterForm;
