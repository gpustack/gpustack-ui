import LabelSelector from '@/components/label-selector';
import { LabelSelectorContext } from '@/components/label-selector/context';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { FormData } from '../config/types';

const Endpoints = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const endpoints = Form.useWatch('endpoints', form);

  const handleEndpointsChange = (labels: Record<string, any>) => {
    form.setFieldValue('endpoints', labels);
  };

  return (
    <>
      <LabelSelectorContext.Provider
        value={{
          placeholder: ['Model', 'Weight'],
          options: [
            {
              label: 'max_token_len',
              value: 'max_token_len'
            },
            {
              label: 'max_context_len',
              value: 'max_context_len'
            }
          ]
        }}
      >
        <Form.Item
          name="endpoints"
          data-field="endpoints"
          rules={[
            ({ getFieldValue }) => ({
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
                            id: 'models.form.selector'
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
            isAutoComplete
            label={'Endpoints'}
            labels={endpoints}
            btnText="Add Endpoint"
            onChange={handleEndpointsChange}
          ></LabelSelector>
        </Form.Item>
      </LabelSelectorContext.Provider>
    </>
  );
};

export default Endpoints;
