import LabelSelector from '@/components/label-selector';
import { LabelSelectorContext } from '@/components/label-selector/context';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { FormData } from '../config/types';

const MetaData = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const metadata = Form.useWatch('meta', form);

  const handleMetadataChange = (labels: Record<string, any>) => {
    form.setFieldValue('meta', labels);
  };

  return (
    <>
      <LabelSelectorContext.Provider
        value={{
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
          name="meta"
          data-field="metadata"
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
            label={'Metadatas'}
            labels={metadata}
            btnText="Add Metadata"
            onChange={handleMetadataChange}
          ></LabelSelector>
        </Form.Item>
      </LabelSelectorContext.Provider>
    </>
  );
};

export default MetaData;
