import IconFont from '@/components/icon-font';
import OverlayScroller from '@/components/overlay-scroller';
import { CloseCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Divider, Form, Popover } from 'antd';
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 12px 8px;
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

const Filters = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0;
  cursor: pointer;
  .count {
    display: flex;
    width: 16px;
    height: 16px;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 500;
    background-color: var(--ant-color-bg-text-active);
    color: var(--ant-color-text-secondary);
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .close-btn {
    border-radius: 50%;
    color: var(--ant-color-text-quaternary);
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
    placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
    onClose?: () => void;
    onValuesChange?: (ChangeValues: any, allValues: any) => void;
  }
> = ({
  children,
  width = 300,
  contentHeight = 400,
  initialValues = {},
  placement = 'bottomLeft',
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
    setOpen(false);
    setHasFilters(false);
    form.resetFields();
    onValuesChange?.({}, form.getFieldsValue());
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

  const handleOnClear = () => {
    handleOnReset();
  };

  const filtersCount = Object.values(form.getFieldsValue()).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;

  const renderFooter = () => {
    return (
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
    );
  };

  return (
    <Popover
      open={open}
      trigger={['click', 'hover']}
      arrow={false}
      placement={placement}
      content={
        <Container>
          <OverlayScroller
            maxHeight={contentHeight}
            styles={{
              wrapper: {
                paddingInline: 8
              }
            }}
          >
            <Form
              onValuesChange={handleOnValuesChange}
              initialValues={initialValues}
              form={form}
              layout="vertical"
              styles={{
                label: {
                  lineHeight: 1,
                  height: 'auto',
                  marginBottom: 8,
                  fontWeight: 500
                },
                content: {
                  minHeight: 0
                }
              }}
            >
              {children}
            </Form>
          </OverlayScroller>
        </Container>
      }
      onOpenChange={handleOpenChange}
      styles={{
        container: {
          padding: 8,
          border: '1px solid var(--ant-color-split)'
        },
        root: {
          width: width
        }
      }}
    >
      <ButtonWrapper>
        <Divider orientation="vertical" style={{ height: 16 }} />
        <Button
          size="small"
          type="text"
          variant="filled"
          color="default"
          shape="round"
        >
          <Filters>
            <span
              style={{
                fontSize: 12,
                color: 'var(--ant-color-text-secondary)',
                fontWeight: 400
              }}
            >
              More Filters
            </span>
            {filtersCount > 0 ? (
              <>
                <span className="count">{filtersCount}</span>
                <span className="close-btn">
                  <CloseCircleFilled
                    style={{ fontSize: 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOnClear();
                    }}
                  />
                </span>
              </>
            ) : (
              <IconFont
                type="icon-filter-list"
                style={{ fontSize: 14 }}
              ></IconFont>
            )}
          </Filters>
        </Button>
      </ButtonWrapper>
    </Popover>
  );
};

export default FilterForm;
