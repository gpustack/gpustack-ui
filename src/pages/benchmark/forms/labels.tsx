import { LabelSelector } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { FormData } from '../config/types';

const LabelsForm: React.FC = () => {
  const intl = useIntl();

  return (
    <Form.Item<FormData>
      name="labels"
      rules={[
        () => ({
          validator(rule, value) {
            if (_.keys(value).length > 0) {
              if (_.some(_.keys(value), (k: string) => !value[k])) {
                return Promise.reject(
                  intl.formatMessage(
                    {
                      id: 'common.validate.value'
                    },
                    {
                      name: intl.formatMessage({
                        id: 'resources.form.label'
                      })
                    }
                  )
                );
              }
            }
            return Promise.resolve();
          }
        })
      ]}
    >
      <LabelSelector
        label={intl.formatMessage({
          id: 'resources.table.labels'
        })}
        btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
      ></LabelSelector>
    </Form.Item>
  );
};

export default LabelsForm;
