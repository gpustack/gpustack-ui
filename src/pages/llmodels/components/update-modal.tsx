import ModalFooter from '@/components/modal-footer';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import _ from 'lodash';
import { memo, useEffect, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { queryGPUList, queryHuggingfaceModelFiles } from '../apis';
import {
  backendOptionsMap,
  modelSourceMap,
  setSourceRepoConfigValue
} from '../config';
import { FormData, GPUListItem, ListItem } from '../config/types';
import AdvanceConfig from './advance-config';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const sourceOptions = [
  {
    label: 'Hugging Face',
    value: modelSourceMap.huggingface_value,
    key: 'huggingface'
  },
  {
    label: 'Ollama Library',
    value: modelSourceMap.ollama_library_value,
    key: 'ollama_library'
  },
  {
    label: 'ModelScope',
    value: modelSourceMap.modelscope_value,
    key: 'model_scope'
  }
];

const SEARCH_SOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const UpdateModal: React.FC<AddModalProps> = (props) => {
  console.log('addmodel====');
  const { title, action, open, onOk, onCancel } = props || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const [gpuOptions, setGpuOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const modelSource = Form.useWatch('source', form);
  const [fileOptions, setFileOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const getGPUList = async () => {
    const data = await queryGPUList();
    const list = _.map(data.items, (item: GPUListItem) => {
      return {
        ...item,
        label: item.name,
        value: `${item.worker_name}-${item.name}-${item.index}`
      };
    });
    setGpuOptions(list);
  };

  const initFormValue = () => {
    if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        source: modelSourceMap.huggingface_value,
        replicas: 1
      });
    }
    if (action === PageAction.EDIT && open) {
      const result = setSourceRepoConfigValue(
        props.data?.source || '',
        props.data
      );
      form.setFieldsValue({
        ...result.values,
        ..._.omit(props.data, result.omits),
        scheduleType: props.data?.gpu_selector ? 'manual' : 'auto',
        gpu_selector: props.data?.gpu_selector
          ? `${props.data?.gpu_selector.worker_name}-${props.data?.gpu_selector.gpu_name}-${props.data?.gpu_selector.gpu_index}`
          : null
      });
    }
  };

  useEffect(() => {
    initFormValue();
  }, [open]);

  const fileNamLabel = (item: any) => {
    return (
      <span>
        {item.path}
        <span
          style={{ color: 'var(--ant-color-text-tertiary)', marginLeft: '4px' }}
        >
          ({convertFileSize(item.size)})
        </span>
      </span>
    );
  };
  const handleFetchModelFiles = async (repo: string) => {
    try {
      setLoading(true);
      const res = await queryHuggingfaceModelFiles({ repo });
      const list = _.filter(res, (file: any) => {
        return _.endsWith(file.path, '.gguf');
      }).map((item: any) => {
        return {
          label: fileNamLabel(item),
          value: item.path,
          size: item.size
        };
      });
      setFileOptions(list);
      setLoading(false);
    } catch (error) {
      setFileOptions([]);
      setLoading(false);
    }
  };

  const handleRepoOnBlur = (e: any) => {
    const repo = form.getFieldValue('repo_id');
    handleFetchModelFiles(repo);
  };

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="repo_id"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.repoid' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.repoid' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
        {form.getFieldValue('file_name') && (
          <Form.Item<FormData>
            name="file_name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  { name: intl.formatMessage({ id: 'models.form.filename' }) }
                )
              }
            ]}
          >
            <SealAutoComplete
              filterOption
              label={intl.formatMessage({ id: 'models.form.filename' })}
              required
              options={fileOptions}
              loading={loading}
              disabled={action === PageAction.EDIT}
            ></SealAutoComplete>
          </Form.Item>
        )}
      </>
    );
  };

  const renderS3Fields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="s3_address"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.s3address' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'models.form.s3address'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderOllamaModelFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="ollama_library_model_name"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.table.name' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = useMemo(() => {
    if (SEARCH_SOURCE.includes(props.data?.source || '')) {
      return renderHuggingfaceFields();
    }

    if (props.data?.source === modelSourceMap.ollama_library_value) {
      return renderOllamaModelFields();
    }

    if (props.data?.source === modelSourceMap.s3_value) {
      return renderS3Fields();
    }

    return null;
  }, [props.data?.source]);

  const handleSumit = () => {
    form.submit();
  };

  const handleOk = (formdata: FormData) => {
    if (formdata.scheduleType === 'manual') {
      const gpu = _.find(gpuOptions, (item: any) => {
        return item.value === formdata.gpu_selector;
      });

      onOk({
        ..._.omit(formdata, ['scheduleType']),
        worker_selector: null,
        gpu_selector: gpu
          ? {
              gpu_name: gpu.name,
              gpu_index: gpu.index,
              worker_name: gpu.worker_name
            }
          : null
      });
    } else {
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        gpu_selector: null
      });
    }
  };

  useEffect(() => {
    getGPUList();
  }, []);

  return (
    <Modal
      title={title}
      open={open}
      centered={true}
      onOk={handleSumit}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{
        content: {
          padding: '0px'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0'
        },
        footer: {
          padding: '0 var(--ant-modal-content-padding)'
        }
      }}
      footer={
        <ModalFooter onCancel={onCancel} onOk={handleSumit}></ModalFooter>
      }
    >
      <SimpleBar
        style={{
          maxHeight: '550px'
        }}
      >
        <Form
          name="addModalForm"
          form={form}
          onFinish={handleOk}
          preserve={false}
          style={{
            padding: 'var(--ant-modal-content-padding)',
            paddingBlock: 0
          }}
        >
          <Form.Item<FormData>
            name="name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  { name: intl.formatMessage({ id: 'common.table.name' }) }
                )
              }
            ]}
          >
            <SealInput.Input
              label={intl.formatMessage({
                id: 'common.table.name'
              })}
              required
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name="source"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.select'
                  },
                  { name: intl.formatMessage({ id: 'models.form.source' }) }
                )
              }
            ]}
          >
            {action === PageAction.EDIT && (
              <SealSelect
                disabled={true}
                label={intl.formatMessage({
                  id: 'models.form.source'
                })}
                options={sourceOptions}
                required
              ></SealSelect>
            )}
          </Form.Item>
          {renderFieldsBySource}
          <Form.Item<FormData>
            name="replicas"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  {
                    name: intl.formatMessage({ id: 'models.form.replicas' })
                  }
                )
              }
            ]}
          >
            <SealInput.Number
              style={{ width: '100%' }}
              label={intl.formatMessage({
                id: 'models.form.replicas'
              })}
              required
              min={0}
            ></SealInput.Number>
          </Form.Item>
          <Form.Item<FormData> name="description">
            <SealInput.TextArea
              label={intl.formatMessage({
                id: 'common.table.description'
              })}
            ></SealInput.TextArea>
          </Form.Item>

          <AdvanceConfig
            form={form}
            gpuOptions={gpuOptions}
            action={PageAction.EDIT}
            isGGUF={
              form.getFieldValue('backend') === backendOptionsMap.llamaBox
            }
          ></AdvanceConfig>
        </Form>
      </SimpleBar>
    </Modal>
  );
};

export default memo(UpdateModal);
