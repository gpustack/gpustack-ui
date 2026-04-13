import { Select as SealSelect } from '@gpustack/core-ui';
import React from 'react';
import { categoryConfig } from './model-tag';

const CategorySelect = (props: any) => {
  const { options, ...rest } = props;

  const optionRenderer = (option: any) => {
    const config = categoryConfig[option.value] || {};
    console.log('option:', option, 'config:', config);
    return (
      <span className="flex-center">
        <span style={{ color: config.color }}>
          {React.cloneElement(config.icon)}
        </span>
        <span style={{ marginLeft: 8 }}>{option.label}</span>
      </span>
    );
  };
  return <SealSelect options={options} {...rest} />;
};

export default CategorySelect;
