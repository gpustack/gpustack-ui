import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Drawer, Form } from 'antd';
import _ from 'lodash';
import { memo, useCallback, useEffect, useState } from 'react';
import { queryHuggingfaceModelFiles, queryHuggingfaceModels } from '../apis';
import { modelSourceMap } from '../config';
import { FormData, ListItem } from '../config/types';
import ColumnWrapper from './column-wrapper';
import HFModelFile from './hf-model-file';
import ModelCard from './model-card';
import SearchModel from './search-model';
import TitleWrapper from './title-wrapper';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  source: string;
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
  }
];

const AddModal: React.FC<AddModalProps> = (props) => {
  console.log('addmodel====');
  const { title, action, open, source, onOk, onCancel } = props || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const modelSource = Form.useWatch('source', form);
  const huggingfaceRepoId = Form.useWatch('huggingface_repo_id', form);
  const [loading, setLoading] = useState(false);
  const [repoOptions, setRepoOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [fileOptions, setFileOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const initFormValue = () => {
    form.setFieldsValue({
      source: props.source,
      replicas: 1
    });
  };

  useEffect(() => {
    initFormValue();
    console.log('source========', props.source);
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
    const repo = form.getFieldValue('huggingface_repo_id');
    handleFetchModelFiles(repo);
  };

  const handleSelectModelFile = useCallback((item: any) => {
    form.setFieldValue('huggingface_filename', item.path);
  }, []);

  const handleOnSearchRepo = async (text: string) => {
    try {
      const params = {
        search: {
          query: text,
          tags: ['gguf']
        }
      };
      const models = await queryHuggingfaceModels(params);
      const list = _.map(models || [], (item: any) => {
        return {
          ...item,
          value: item.name,
          label: item.name
        };
      });
      setRepoOptions(list);
    } catch (error) {
      setRepoOptions([]);
    }
  };

  const debounceSearch = _.debounce((text: string) => {
    handleOnSearchRepo(text);
  }, 300);

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="huggingface_repo_id"
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
        <Form.Item<FormData>
          name="huggingface_filename"
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
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.filename' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
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

  const renderFieldsBySource = () => {
    switch (props.source) {
      case modelSourceMap.huggingface_value:
        return renderHuggingfaceFields();
      case modelSourceMap.ollama_library_value:
        return renderOllamaModelFields();
      case modelSourceMap.s3_value:
        return renderS3Fields();
      default:
        return null;
    }
  };

  const handleOnSelectModel = useCallback((item: any) => {
    const repo = item.name;
    let name = _.split(item.name, '/').slice(-1)[0];
    const reg = /(-gguf)$/i;
    name = _.toLower(name).replace(reg, '');

    if (form.getFieldValue('source') === modelSourceMap.huggingface_value) {
      form.setFieldsValue({
        huggingface_repo_id: repo,
        name: name
      });
    } else {
      form.setFieldsValue({
        ollama_library_model_name: repo,
        name: name
      });
    }
  }, []);

  const handleSumit = () => {
    form.submit();
  };

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      styles={{
        body: {
          height: 'calc(100vh - 53px)',
          padding: '16px 0'
        }
      }}
      width="90%"
      footer={false}
    >
      <div style={{ display: 'flex' }}>
        <ColumnWrapper>
          <SearchModel
            modelSource={modelSource}
            onSelectModel={handleOnSelectModel}
          ></SearchModel>
        </ColumnWrapper>
        {modelSource === modelSourceMap.huggingface_value && (
          <ColumnWrapper>
            <ModelCard repo={huggingfaceRepoId}></ModelCard>
            <HFModelFile
              repo={huggingfaceRepoId}
              onSelectFile={handleSelectModelFile}
            ></HFModelFile>
          </ColumnWrapper>
        )}
        <ColumnWrapper
          footer={
            <ModalFooter
              onCancel={onCancel}
              onOk={handleSumit}
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            ></ModalFooter>
          }
        >
          <TitleWrapper>Configuration</TitleWrapper>
          <Form
            name="deployModel"
            form={form}
            onFinish={onOk}
            preserve={false}
            style={{ padding: '16px 20px' }}
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
              {
                <SealSelect
                  disabled={true}
                  label={intl.formatMessage({
                    id: 'models.form.source'
                  })}
                  options={sourceOptions}
                  required
                ></SealSelect>
              }
            </Form.Item>
            {renderFieldsBySource()}
            <Form.Item<FormData>
              name="replicas"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    {
                      id: 'common.form.rule.input'
                    },
                    { name: intl.formatMessage({ id: 'models.form.replicas' }) }
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
          </Form>
        </ColumnWrapper>
      </div>
    </Drawer>
  );
};

export default memo(AddModal);
