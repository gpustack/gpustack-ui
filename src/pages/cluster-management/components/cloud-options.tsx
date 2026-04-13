import { DropdownActions } from '@gpustack/core-ui';
import ListMap from '@gpustack/core-ui/lib/components/dynamic-form/components/list-map';
import { FieldSchema } from '@gpustack/core-ui/lib/components/dynamic-form/config/types';

import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Button, Form } from 'antd';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import styled from 'styled-components';
import { CloudOptionItems } from '../config';
import { fieldConfig } from '../config/cloud-options-config';

const Title = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  gap: 16px;
  border-radius: var(--ant-border-radius);
  margin-bottom: 22px;
  font-weight: 600;
`;

const CloudOptions: React.FC<{
  ref?: any;
}> = forwardRef((props, ref) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const [selectedOptions, setSelectedOptions] = React.useState<Set<string>>(
    new Set()
  );
  const [fieldList, setFieldList] = React.useState<FieldSchema[]>([]);

  const items = useMemo(() => {
    return CloudOptionItems.map((item) => ({
      ...item,
      disabled: selectedOptions.has(item.key)
    }));
  }, [selectedOptions]);

  const handleAddOption = useMemoizedFn((item: { key: string }) => {
    const field = fieldConfig[item.key];
    setFieldList((prev) => [...prev, { ...field, name: item.key }]);
    setSelectedOptions((prev) => new Set(prev).add(item.key));
  });

  const menu = useMemo(() => {
    return {
      items: items,
      onClick: handleAddOption
    };
  }, [items, handleAddOption]);

  const handleOnChange = (name: string, value: any) => {
    form.setFieldValue(['cloud_options', name], value);
    if (_.isEmpty(value)) {
      setFieldList((prev) => prev.filter((field) => field.name !== name));
      setSelectedOptions((prev) => {
        const newSelected = new Set(prev);
        newSelected.delete(name);
        return newSelected;
      });
    }
  };

  // init field list by form data
  const initFieldList = () => {
    const cloudOptions = form.getFieldValue('cloud_options');
    if (cloudOptions) {
      const fields = Object.entries(cloudOptions)
        .filter(([, value]) => {
          return !_.isEmpty(value);
        })
        .map(([key, value]) => {
          const field = fieldConfig[key];
          return { ...field, name: key };
        });
      setFieldList(fields);
      setSelectedOptions(new Set(Object.keys(cloudOptions)));
    }
  };

  useImperativeHandle(ref, () => ({
    initFieldList
  }));

  return (
    <>
      <Title>
        <DropdownActions menu={menu}>
          <Button variant="filled" color="default">
            <PlusOutlined />
            <span>
              {intl.formatMessage({ id: 'clusters.workerpool.cloudOptions' })}
            </span>
          </Button>
        </DropdownActions>
      </Title>
      {fieldList.length > 0 &&
        fieldList.map((field) => (
          <Form.Item
            key={field.name}
            name={['cloud_options', field.name as string]}
          >
            <ListMap
              btnText={intl.formatMessage({ id: 'common.button.addItem' })}
              label={field.title}
              dataList={form.getFieldValue(['cloud_options', field.name]) || []}
              properties={field.properties || {}}
              onChange={(value) => handleOnChange(field.name, value)}
            />
          </Form.Item>
        ))}
    </>
  );
});

export default CloudOptions;
