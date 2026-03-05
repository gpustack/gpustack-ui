import AutoComplete from '@/components/seal-form/auto-complete';
import CheckboxField from '@/components/seal-form/checkbox-field';
import SealSelect from '@/components/seal-form/seal-select';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { getLocale, useIntl, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import ModelSelect from '../../components/model-select';
import ParamsFields from '../../components/params-fields';
import { FormContext, useFormContext } from '../../config/form-context';
import { TTSAdvancedParamsConfig } from '../params-config';
import AdvanceConfig from './tts-advance';

const MetaFields = [
  'task_type',
  'language',
  'instructions',
  'max_new_tokens',
  'ref_audio'
];

type ParamsSettingsProps = {
  ref?: any;
  modelList?: Global.BaseOption<string>[];
  onFinish?: (values: any) => void;
  onFinishFailed?: (errorInfo: any) => void;
  updatateParams: (values: Record<string, any>) => void;
};

const ParamsSettings: React.FC<ParamsSettingsProps> = forwardRef(
  ({ onFinish, onFinishFailed, updatateParams, modelList = [] }, ref) => {
    const { onValuesChange } = useFormContext();
    const [searchParams] = useSearchParams();
    const modelType = searchParams.get('type') || '';
    const selectModel = searchParams.get('model')
      ? modelType === 'tts' && searchParams.get('model')
      : '';
    const locale = getLocale();
    const intl = useIntl();
    const [form] = Form.useForm();
    const [activeKey, setActiveKey] = useState<string | string[]>(
      'advanced_config'
    );
    const [vociceOptions, setVoiceOptions] = useState<
      Global.BaseOption<string>[]
    >([]);
    const [meta, setModelMeta] = useState<Record<string, any>>({});
    const initializeRef = React.useRef<boolean>(false);

    useImperativeHandle(ref, () => ({
      form,
      getFieldsValue: form.getFieldsValue,
      setFieldsValue: form.setFieldsValue
    }));

    const handleOnFinish = (values: any) => {
      onFinish?.(values);
    };

    const handleOnFinishFailed = (errorInfo: any) => {
      onFinishFailed?.(errorInfo);
    };

    const handleOnCollapse = (keys: string | string[]) => {
      setActiveKey(keys);
    };

    const sortVoiceList = (
      locale: string,
      voiceDataList: Global.BaseOption<string>[]
    ) => {
      const lang = locale === 'en-US' ? 'english' : 'chinese';

      const list = voiceDataList.sort((a, b) => {
        const aContains = a.value.toLowerCase().includes(lang) ? 1 : 0;
        const bContains = b.value.toLowerCase().includes(lang) ? 1 : 0;
        return bContains - aContains;
      });
      return list;
    };

    const updateVoiceOptions = (model: Global.BaseOption<string>) => {
      const list = _.map(model?.meta?.voices || [], (item: any) => {
        return {
          label: item,
          value: item
        };
      });

      const newList = sortVoiceList(locale, list);
      setVoiceOptions(newList);
      return newList;
    };

    const handleSelectModel = useMemoizedFn(async (value: string) => {
      if (!value) {
        return;
      }

      const model = modelList.find((item) => item.value === value);
      const newList = updateVoiceOptions(model!);
      setModelMeta(model?.meta || {});

      const values = {
        ..._.pick(model?.meta || {}, MetaFields),
        task_type: model?.meta?.task_type,
        model: value,
        language: model?.meta?.languages?.[0] || '',
        voice: newList[0]?.value
      };
      updatateParams(values);
      form.setFieldsValue(values);
    });

    const handleOnValuesChange = (
      changeValues: Record<string, any>,
      allValues: Record<string, any>
    ) => {
      if (changeValues.model) {
        return;
      }

      if ('stream' in changeValues && changeValues.stream) {
        allValues.response_format = 'pcm';
        form.setFieldsValue({
          response_format: 'pcm'
        });
      }

      updatateParams(allValues);
    };

    useEffect(() => {
      if (initializeRef.current || !modelList.length) return;
      const defaultModel = selectModel || modelList[0]?.value || '';

      if (defaultModel && modelList.length) {
        handleSelectModel(defaultModel);
        initializeRef.current = true;
      }
    }, [selectModel, modelList.length]);

    return (
      <FormContext.Provider
        value={{
          meta,
          modelList: modelList || [],
          onValuesChange: handleOnValuesChange,
          onModelChange: handleSelectModel
        }}
      >
        <Form
          form={form}
          onValuesChange={handleOnValuesChange}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={{
            voice: '',
            model: '',
            response_format: 'mp3'
          }}
        >
          <ModelSelect></ModelSelect>
          <Form.Item name="voice">
            <AutoComplete
              label={intl.formatMessage({ id: 'playground.params.voice' })}
              options={vociceOptions}
            ></AutoComplete>
          </Form.Item>
          <Form.Item name="response_format" style={{ marginBottom: 8 }}>
            <SealSelect
              label={intl.formatMessage({ id: 'playground.params.format' })}
              options={[
                { label: 'mp3', value: 'mp3' },
                { label: 'wav', value: 'wav' },
                { label: 'pcm', value: 'pcm' }
              ]}
            ></SealSelect>
          </Form.Item>
          <Form.Item
            name="stream"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField
              label={intl.formatMessage({
                id: 'playground.params.streamMode'
              })}
            ></CheckboxField>
          </Form.Item>
          <CollapsePanel
            activeKey={activeKey}
            onChange={handleOnCollapse}
            accordion={false}
            items={[
              {
                key: 'advanced_config',
                label: intl.formatMessage({ id: 'resources.form.advanced' }),
                forceRender: true,
                children: (
                  <>
                    <ParamsFields
                      paramsConfig={TTSAdvancedParamsConfig}
                    ></ParamsFields>
                    <AdvanceConfig />
                  </>
                )
              }
            ]}
          ></CollapsePanel>
        </Form>
      </FormContext.Provider>
    );
  }
);

export default ParamsSettings;
