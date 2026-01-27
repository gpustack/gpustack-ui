import LabelSelector from '@/components/label-selector';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { FormData } from '../config/types';

const LabelsForm: React.FC = () => {
  const form = Form.useFormInstance();
  const labels = Form.useWatch('labels', form);
  const intl = useIntl();

  const handleLabelsChange = (labels: object) => {
    form.setFieldValue('labels', labels);
  };

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
        labels={labels}
        btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
        onChange={handleLabelsChange}
      ></LabelSelector>
    </Form.Item>
  );
};

export default LabelsForm;
