import type { FormInstance } from 'antd';
import React from 'react';
import type { FormData, RuntimeChoice } from '../config/types';

export const useRuntimeChoiceMode = (
  form: FormInstance<FormData>,
  initialValues?: FormData
) => {
  const [imageModePicked, setImageModePicked] = React.useState<boolean>(
    Boolean(initialValues?.image_name)
  );

  const applyRuntimeChoice = (runtime: RuntimeChoice) => {
    form.setFieldsValue(runtime);
    setImageModePicked(Boolean(runtime.image_name));
  };

  return { imageModePicked, setImageModePicked, applyRuntimeChoice };
};
