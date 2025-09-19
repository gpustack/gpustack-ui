import { useRef } from 'react';
import { statusType } from '../config/types';

export default function useValidateFields(params: {
  requiredFields?: string[];
  setValidateStatusList: (statusList: { [key: string]: statusType }[]) => void;
}) {
  const { requiredFields, setValidateStatusList } = params;
  const validationEnabled = useRef(false);

  const isEmptyValue = (value: any, key: string) => {
    return !value;
  };

  const validateRule = (value: any, key: string) => {
    return true;
  };

  const listMapValidator = async (_: any, valueList: any) => {
    if (!validationEnabled.current) {
      return Promise.resolve();
    }

    const fields = new Set<string>();
    const statusList: { [key: string]: statusType }[] = [];

    (valueList || []).forEach((item: any, index: number) => {
      const status: { [key: string]: statusType } = {};
      Object.entries(item || {}).forEach(([key, value]) => {
        if (isEmptyValue(value, key)) {
          fields.add(key);
          if (requiredFields?.includes(key)) {
            status[key] = 'error';
          } else {
            status[key] = '';
          }
        } else if (validateRule(value, key)) {
          status[key] = '';
        }
      });
      statusList.push(status);
    });

    setValidateStatusList(statusList);

    if (fields.size > 0) {
      return Promise.reject(`${Array.from(fields).join(', ')} is required`);
    }

    return Promise.resolve();
  };

  const toggleValidation = (enabled: boolean) => {
    validationEnabled.current = enabled;
  };

  return {
    listMapValidator,
    toggleValidation
  };
}
