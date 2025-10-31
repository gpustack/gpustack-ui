import AutoComlete from '@/components/seal-form/auto-complete';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import useAppUtils from '@/hooks/use-app-utils';
import useDeferredRequest from '@/hooks/use-deferred-request';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import {
  queryDraftModelList,
  queryHuggingfaceModels,
  queryModelScopeModels
} from '../apis';
import { modelSourceMap } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

const AlgorithmMap = {
  Eagle3: 'eagle3',
  MTP: 'mtp',
  Ngram: 'ngram'
};

const SpeculativeDecode = () => {
  const intl = useIntl();
  const { source } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const speculativeEnabled = Form.useWatch(
    ['speculative_config', 'enabled'],
    form
  );
  const algorithm = Form.useWatch(['speculative_config', 'algorithm'], form);
  const [draftModelList, setDraftModelList] = useState<
    Global.BaseOption<string, { options: Global.BaseOption<string>[] }>[]
  >([]);
  const presetDraftModelListRef = useRef<Global.BaseOption<string>[]>([]);
  const speculativeConfigRef = useRef<any>({});
  const axiosTokenRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDraftModels = async () => {
    const response = await queryDraftModelList({
      page: 1,
      perPage: 100
    });
    const options = response.items.map((item) => ({
      label: item.name,
      value: item.name
    }));
    presetDraftModelListRef.current = options;
    setDraftModelList(options);
  };

  const getHuggingfaceModels = async (query: string) => {
    if (axiosTokenRef.current) {
      axiosTokenRef.current.abort();
    }
    axiosTokenRef.current = new AbortController();
    try {
      const params = {
        limit: 10,
        search: {
          query: query
        }
      };
      setLoading(true);
      const data = await queryHuggingfaceModels(params, {
        signal: axiosTokenRef.current.signal
      });
      const list = _.map(data || [], (item: any) => {
        return {
          value: item.name,
          label: item.name
        };
      });

      const catalogModelList =
        presetDraftModelListRef.current.length > 0
          ? [
              {
                label: `${intl.formatMessage({ id: 'models.form.source' })}: ${intl.formatMessage({ id: 'menu.models.modelCatalog' })}`,
                title: `${intl.formatMessage({ id: 'models.form.source' })}: ${intl.formatMessage({ id: 'menu.models.modelCatalog' })}`,
                options: presetDraftModelListRef.current || []
              }
            ]
          : [];

      setDraftModelList([
        ...catalogModelList,
        {
          label: `${intl.formatMessage({ id: 'models.form.source' })}: Hugging Face`,
          title: `${intl.formatMessage({ id: 'models.form.source' })}: Hugging Face`,
          options: list
        }
      ]);
    } catch (error) {
      setDraftModelList(presetDraftModelListRef.current);
    } finally {
      setLoading(false);
    }
  };

  const getModelScopeModels = async (query: string) => {
    if (axiosTokenRef.current) {
      axiosTokenRef.current.abort();
    }
    axiosTokenRef.current = new AbortController();
    try {
      const params = {
        Name: query,
        PageSize: 10,
        PageNumber: 1,
        tasks: []
      };
      setLoading(true);
      const data = await queryModelScopeModels(params, {
        signal: axiosTokenRef.current.signal
      });
      const list = _.map(
        _.get(data, 'Data.Model.Models') || [],
        (item: any) => {
          return {
            label: `${item.Path}/${item.Name}`,
            value: `${item.Path}/${item.Name}`
          };
        }
      );

      const catalogModelList =
        presetDraftModelListRef.current.length > 0
          ? [
              {
                label: `${intl.formatMessage({ id: 'models.form.source' })}: ${intl.formatMessage({ id: 'menu.models.modelCatalog' })}`,
                title: `${intl.formatMessage({ id: 'models.form.source' })}: ${intl.formatMessage({ id: 'menu.models.modelCatalog' })}`,
                options: presetDraftModelListRef.current || []
              }
            ]
          : [];

      setDraftModelList([
        ...catalogModelList,
        {
          label: `${intl.formatMessage({ id: 'models.form.source' })}: ModelScope`,
          title: `${intl.formatMessage({ id: 'models.form.source' })}: ModelScope`,
          options: list
        }
      ]);
    } catch (error) {
      setDraftModelList(presetDraftModelListRef.current);
    } finally {
      setLoading(false);
    }
  };

  const handleOnSearch = async (value: string) => {
    if (!value) {
      setDraftModelList(presetDraftModelListRef.current);
      return;
    }
    if (source === modelSourceMap.huggingface_value) {
      await getHuggingfaceModels(value);
    } else if (source === modelSourceMap.modelscope_value) {
      await getModelScopeModels(value);
    }
  };

  const { run: onSearch } = useDeferredRequest(
    (value: string) => handleOnSearch(value),
    150
  );

  const handleSpeculativeEnabledChange = (e: any) => {
    if (e.target.checked) {
      form.setFieldValue('speculative_config', {
        enabled: true,
        algorithm:
          speculativeConfigRef.current.algorithm || AlgorithmMap.Eagle3,
        draft_model: speculativeConfigRef.current.draft_model || '',
        num_draft_tokens: speculativeConfigRef.current.num_draft_tokens || 3,
        ngram_min_match_length:
          speculativeConfigRef.current.ngram_min_match_length || 1,
        ngram_max_match_length:
          speculativeConfigRef.current.ngram_max_match_length || 10
      });
    } else {
      speculativeConfigRef.current = form.getFieldValue('speculative_config');
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
                label={intl.formatMessage({ id: 'models.form.draftModel' })}
                placeholder={intl.formatMessage({
                  id: 'models.form.draftModel.placeholder'
                })}
                description={intl.formatMessage({
                  id: 'models.form.draftModel.tips'
                })}
                options={draftModelList}
                onSearch={onSearch}
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
