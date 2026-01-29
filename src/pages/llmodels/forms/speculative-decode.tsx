import AutoComlete from '@/components/seal-form/auto-complete';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo, useRef } from 'react';
import { backendOptionsMap } from '../config/backend-parameters';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useQueryDraftModels from '../hooks/use-query-draftModels';

const AlgorithmMap = {
  Eagle3: 'eagle3',
  MTP: 'mtp',
  Ngram: 'ngram'
};

const SpeculativeDecode = () => {
  const intl = useIntl();
  const { source, flatBackendOptions, onValuesChange } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const backend = Form.useWatch('backend', form);
  const speculativeEnabled = Form.useWatch(
    ['speculative_config', 'enabled'],
    form
  );
  const algorithm = Form.useWatch(['speculative_config', 'algorithm'], form);
  const speculativeConfigRef = useRef<any>({});

  const { draftModelList, loading, resetDraftModels, onSearch } =
    useQueryDraftModels({
      source
    });

  const onValuesChangeDebounced = _.debounce(() => {
    const allValues = form.getFieldsValue();
    onValuesChange?.({}, allValues);
  }, 150);

  const handleSpeculativeEnabledChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldValue('speculative_config', {
        enabled: true,
        algorithm:
          speculativeConfigRef.current.algorithm || AlgorithmMap.Eagle3,
        draft_model: speculativeConfigRef.current.draft_model || '',
        num_draft_tokens: speculativeConfigRef.current.num_draft_tokens || 4,
        ngram_min_match_length:
          speculativeConfigRef.current.ngram_min_match_length || 1,
        ngram_max_match_length:
          speculativeConfigRef.current.ngram_max_match_length || 10
      });
    } else {
      speculativeConfigRef.current = form.getFieldValue('speculative_config');
    }
    onValuesChangeDebounced();
  };

  const handleAlgorithemChange = (value: string) => {
    if (value === AlgorithmMap.Eagle3) {
      resetDraftModels();
    }
  };

  const handleOnDraftBlur = () => {
    onValuesChangeDebounced();
  };

  const handleDraftSelect = (value: string) => {
    onValuesChangeDebounced();
  };

  const builtInBackend = useMemo(() => {
    const currentBackend = flatBackendOptions.find(
      (item) => item.value === backend
    );

    return (
      currentBackend?.isBuiltIn &&
      [backendOptionsMap.SGLang, backendOptionsMap.vllm].includes(
        backend as string
      )
    );
  }, [backend, flatBackendOptions]);

  return (
    <>
      <Form.Item<FormData>
        name={['speculative_config', 'enabled']}
        valuePropName="checked"
        style={{ marginBottom: 8 }}
        extra={
          !builtInBackend && (
            <span
              dangerouslySetInnerHTML={{
                __html: intl.formatMessage({ id: 'models.form.kvCache.tips' })
              }}
            ></span>
          )
        }
      >
        <CheckboxField
          description={intl.formatMessage({
            id: 'models.form.kvCache.tips2'
          })}
          label={intl.formatMessage({
            id: 'models.form.enableSpeculativeDecoding'
          })}
          onChange={handleSpeculativeEnabledChange}
          disabled={!builtInBackend}
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
              onChange={handleAlgorithemChange}
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
              name={['speculative_config', 'draft_model']}
              rules={[
                {
                  required: true,
                  message: getRuleMessage(
                    ['select', 'input'],
                    'models.form.draftModel'
                  )
                }
              ]}
            >
              <AutoComlete
                required
                allowClear
                loading={loading}
                trim={false}
                clearSpaceOnBlur={true}
                label={intl.formatMessage({ id: 'models.form.draftModel' })}
                placeholder={intl.formatMessage({
                  id: 'models.form.draftModel.placeholder'
                })}
                description={intl.formatMessage({
                  id: 'models.form.draftModel.tips'
                })}
                options={draftModelList}
                showSearch={{
                  onSearch: onSearch
                }}
                onBlur={handleOnDraftBlur}
                onSelect={handleDraftSelect}
              ></AutoComlete>
            </Form.Item>
          )}

          <Form.Item<FormData>
            name={['speculative_config', 'num_draft_tokens']}
          >
            <SealInputNumber
              label={intl.formatMessage({ id: 'models.form.numDraftTokens' })}
              min={1}
              step={1}
              required
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
