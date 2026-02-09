import OverlayScroller from '@/components/overlay-scroller';
import { CloseCircleFilled, FilterOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Badge, Button, Form, Popover } from 'antd';
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

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .badge {
    position: absolute;
    top: 4px;
    right: 4px;
  }
  .close-btn {
    position: absolute;
    display: none;
    top: -4px;
    right: -4px;
    font-size: 12px;
    border-radius: 50%;
    color: var(--ant-color-text-quaternary);
    background-color: var(--ant-color-bg-container);
    &:hover {
      color: var(--ant-color-text-tertiary);
    }
  }
  &:hover {
    .close-btn {
      display: block;
    }
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
  onClose,
  onValuesChange
}) => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);
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
    setHasFilters(false);
  };

  const handleOnClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleOnValuesChange = (changedValues: any, allValues: any) => {
    onValuesChange?.(changedValues, allValues);
    const hasActiveFilters = Object.values(allValues).some(
      (value) => value !== undefined && value !== null && value !== ''
    );
    setHasFilters(hasActiveFilters);
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
              onValuesChange={handleOnValuesChange}
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
      <ButtonWrapper>
        <Button icon={<FilterOutlined />} onClick={handleToggle}></Button>
        {hasFilters && (
          <Badge
            dot
            color={'var(--ant-color-primary-text-hover)'}
            className="badge"
          />
        )}
        {hasFilters && (
          <span className="close-btn">
            <CloseCircleFilled
              style={{ fontSize: 12 }}
              onClick={(e) => {
                e.stopPropagation();
                handleOnReset();
              }}
            />
          </span>
        )}
      </ButtonWrapper>
    </Popover>
  );
};

export default FilterForm;
