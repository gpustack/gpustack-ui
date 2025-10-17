import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect, useState } from 'react';
import { queryDraftModelList } from '../apis';
import { FormData } from '../config/types';

const AlgorithmMap = {
  Eagle3: 'eagle3',
  MTP: 'mtp',
  Ngram: 'ngram'
};

const SpeculativeDecode = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const speculativeEnabled = Form.useWatch(
    ['speculative_config', 'enabled'],
    form
  );
  const algorithm = Form.useWatch(['speculative_config', 'algorithm'], form);
  const [draftModelList, setDraftModelList] = useState<
    Global.BaseOption<string>[]
  >([]);

  const fetchDraftModels = async () => {
    const response = await queryDraftModelList({
      page: 1,
      perPage: 100
    });
    const options = response.items.map((item) => ({
      label: item.name,
      value: item.name
    }));
    setDraftModelList(options);
  };

  const handleSpeculativeEnabledChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldValue('speculative_config', {
        enabled: true,
        algorithm: AlgorithmMap.Eagle3,
        draft_model_name: null,
        num_draft_tokens: 3,
        ngram_min_match_length: 1,
        ngram_max_match_length: 10
      });
    }
  };

  useEffect(() => {
    if (algorithm === AlgorithmMap.Eagle3) {
      fetchDraftModels();
    }
  }, [algorithm]);

  return (
    <>
      <Form.Item<FormData>
        name={['speculative_config', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 8 }}
      >
        <CheckboxField
          label={intl.formatMessage({
            id: 'models.form.enableSpeculativeDecoding'
          })}
          onChange={handleSpeculativeEnabledChange}
        ></CheckboxField>
      </Form.Item>
      {speculativeEnabled && (
        <>
          <Form.Item<FormData>
            name={['speculative_config', 'algorithm']}
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'select',
                  'models.form.algorithm',
                  false
                )
              }
            ]}
          >
            <SealSelect
              required
              label={intl.formatMessage({ id: 'models.form.algorithm' })}
              options={[
                { label: 'Eagle3', value: AlgorithmMap.Eagle3 },
                { label: 'MTP', value: AlgorithmMap.MTP },
                { label: 'N-gram', value: AlgorithmMap.Ngram }
              ]}
            ></SealSelect>
          </Form.Item>
          {algorithm === AlgorithmMap.Eagle3 && (
            <Form.Item<FormData>
              name={['speculative_config', 'draft_model_name']}
              rules={[
                {
                  required: true,
                  message: getRuleMessage('select', 'models.form.draftModel')
                }
              ]}
            >
              <SealSelect
                required
                label={intl.formatMessage({ id: 'models.form.draftModel' })}
                options={draftModelList}
              ></SealSelect>
            </Form.Item>
          )}
          <Form.Item<FormData>
            name={['speculative_config', 'num_draft_tokens']}
          >
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.numDraftTokens' })}
              min={1}
              step={1}
              precision={0}
            />
          </Form.Item>
          {algorithm === AlgorithmMap.Ngram && (
            <>
              <Form.Item<FormData>
                name={['speculative_config', 'ngram_min_match_length']}
              >
                <SealInputNumber
                  label={intl.formatMessage({
                    id: 'models.form.ngramMinMatchLength'
                  })}
                  min={1}
                  step={1}
                />
              </Form.Item>
              <Form.Item<FormData>
                name={['speculative_config', 'ngram_max_match_length']}
              >
                <SealInput.Input
                  label={intl.formatMessage({
                    id: 'models.form.ngramMaxMatchLength'
                  })}
                  min={2}
                  step={1}
                />
              </Form.Item>
            </>
          )}
        </>
      )}
    </>
  );
};

export default SpeculativeDecode;
