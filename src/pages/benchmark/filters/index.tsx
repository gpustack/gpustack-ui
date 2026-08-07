import { SearchOutlined } from '@ant-design/icons';
import { BaseSelect, FilterForm } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { loadTypeOptions } from '../config';

const useStyles = createStyles(({ css }) => ({
  content: css`
    display: flex;
    flex-direction: column;
  `,
  label: css`
    display: inline-flex;
    align-items: center;
    font-size: 13px;
    margin-block: 12px 8px;
    color: var(--ant-color-text-tertiary);
  `
}));

interface FilterFormContentProps {
  clusterList?: Global.BaseOption<number>[];
  profilesOptions?: Global.BaseOption<string>[];
  initialValues?: any;
  open?: boolean;
  ref?: any;
  onClose?: () => void;
  onClear?: () => void;
  onValuesChange: (values: any) => void;
}

const FilterFormContent: React.FC<FilterFormContentProps> = forwardRef(
  (
    { initialValues, onClose, onClear, onValuesChange, open, profilesOptions },
    ref
  ) => {
    const intl = useIntl();
    const { styles } = useStyles();
    const filterRef = useRef<any>(null);

    const handleOnValuesChange = (changedValues: any, allValues: any) => {
      onValuesChange?.(allValues);
    };

    useImperativeHandle(ref, () => ({
      reset: () => {
        filterRef.current?.reset();
      }
    }));

    return (
      <FilterForm
        ref={filterRef}
        width={232}
        contentHeight={'calc(100vh - var(--app-banner-height, 0px) - 122px)'}
        open={open}
        onClose={onClose}
        onClear={onClear}
        onValuesChange={handleOnValuesChange}
        initialValues={initialValues}
        styles={{
          container: {
            paddingInline: '0 8px',
            marginLeft: '-8px'
          },
          wrapper: {
            marginRight: open ? 24 : 0,
            marginTop: '-24px'
          }
        }}
      >
        <div className={styles.content}>
          <span className={styles.label} style={{ marginTop: 0 }}>
            GPU
          </span>
          <Form.Item name="gpu_summary" noStyle>
            <Input
              prefix={
                <SearchOutlined
                  style={{ color: 'var(--ant-color-text-placeholder)' }}
                ></SearchOutlined>
              }
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.bygpu'
              })}
              allowClear
            ></Input>
          </Form.Item>
          <span className={styles.label}>
            {intl.formatMessage({ id: 'benchmark.form.profile' })}
          </span>
          <Form.Item noStyle name="profile">
            <BaseSelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.byProfile'
              })}
              options={(profilesOptions || []).map((item) => ({
                label: item.label,
                value: item.value
              }))}
            ></BaseSelect>
          </Form.Item>
          <span className={styles.label}>
            {intl.formatMessage({ id: 'benchmark.form.loadType' })}
          </span>
          <Form.Item noStyle name="load_type">
            <BaseSelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.byLoadType'
              })}
              options={loadTypeOptions.map((item) => ({
                label: intl.formatMessage({ id: item.label }),
                value: item.value
              }))}
            ></BaseSelect>
          </Form.Item>
          <span className={styles.label}>
            {intl.formatMessage({ id: 'benchmark.table.model' })}
          </span>
          <Form.Item noStyle name="model_name">
            <Input
              prefix={
                <SearchOutlined
                  style={{ color: 'var(--ant-color-text-placeholder)' }}
                ></SearchOutlined>
              }
              placeholder={intl.formatMessage({
                id: 'benchmark.table.filter.bymodel'
              })}
              allowClear
            ></Input>
          </Form.Item>
        </div>
      </FilterForm>
    );
  }
);

export default FilterFormContent;
