import SealCascader from '@/components/seal-form/seal-cascader';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import useAppUtils from '@/hooks/use-app-utils';
import { ModelFileFormData as FormData } from '@/pages/resources/config/types';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import minimatch from 'minimatch';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo
} from 'react';
import { localPathTipsList, modelSourceMap, sourceOptions } from '../config';
import { useGenerateWorkersModelFileOptions } from '../hooks';

type EmptyObject = Record<never, never>;

type CascaderOption<T extends object = EmptyObject> = {
  label: string;
  value: string | number;
  parent?: boolean;
  disabled?: boolean;
  index?: number;
  children?: CascaderOption<T>[];
} & Partial<T>;

interface TargetFormProps {
  ref?: any;
  source: string;
  workerOptions: CascaderOption<{ state: string }>[];
  workersList?: Global.BaseOption<
    number,
    { state: string; labels: Record<string, string>; cluster_id: number }
  >[];
  selectedModel?: Record<string, any>;
  fileName?: string;
  onOk: (values: any) => void;
}

const TargetForm: React.FC<TargetFormProps> = forwardRef((props, ref) => {
  const {
    modelFileOptions,
    getModelFileList,
    generateWorkersModelFileOptions
  } = useGenerateWorkersModelFileOptions();
  const { onOk, source, workerOptions, workersList, selectedModel, fileName } =
    props;
  const { getRuleMessage } = useAppUtils();
  const intl = useIntl();
  const [form] = Form.useForm();
  const localPath = Form.useWatch('local_path', form);

  useEffect(() => {
    const init = async () => {
      try {
        if (workersList && workersList?.length > 0) {
          const modelFiles = await getModelFileList();
          generateWorkersModelFileOptions(modelFiles, workersList || []);
        }
      } catch (error) {}
    };
    init();
  }, [workersList]);

  useImperativeHandle(ref, () => ({
    form
  }));

  const handleOk = (values: any) => {
    const data = _.pickBy(values, (val: string) => val);
    onOk({
      ...data,
      worker_id: data.worker_id?.[1]
    });
  };

  const handleOnLocalPathBlur = (e: any) => {
    let { value } = e.target;

    // remove all the backslashes and slashes at the end of the string
    value = value.replace(/(\\|\/)+$/, '');
    form.setFieldsValue({
      local_path: value
    });
  };

  const renderOptionNode = (props: { data: any }) => {
    const { data } = props;
    const currentWorker = modelFileOptions.find(
      (item) => item.value === data.value
    );

    const isExisting = currentWorker?.children?.some((child) => {
      const isSameFile =
        child.fileName === (fileName || localPath || '') ||
        minimatch(child.fileName || '', fileName || '');

      return child.repoId === (selectedModel?.name || '') && isSameFile;
    });

    const localeId = localPath
      ? 'resources.modelfiles.form.added'
      : 'resources.modelfiles.form.exsting';

    return (
      <span>
        {data.label}
        {isExisting && (
          <span className="text-tertiary m-l-4">
            [{intl.formatMessage({ id: localeId })}]
          </span>
        )}
      </span>
    );
  };

  const renderLocalPathFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="local_path"
          key="local_path"
          rules={[
            {
              required: true,
              message: getRuleMessage('input', 'models.form.filePath')
            }
          ]}
        >
          <SealInput.Input
            required
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            onBlur={handleOnLocalPathBlur}
            description={<TooltipList list={localPathTipsList}></TooltipList>}
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = useMemo(() => {
    if (props.source === modelSourceMap.local_path_value) {
      return renderLocalPathFields();
    }

    return null;
  }, [props.source, intl]);

  return (
    <div>
      <Form
        form={form}
        onFinish={handleOk}
        preserve={false}
        clearOnDestroy={true}
        initialValues={{
          source: source
        }}
      >
        <Form.Item<FormData>
          name="source"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'models.form.source')
            }
          ]}
        >
          {
            <SealSelect
              disabled
              label={intl.formatMessage({
                id: 'models.form.source'
              })}
              options={sourceOptions}
              required
            ></SealSelect>
          }
        </Form.Item>
        {renderFieldsBySource}
        <Form.Item
          name="worker_id"
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'resources.worker')
            }
          ]}
        >
          <SealCascader
            required
            showSearch
            expandTrigger="hover"
            multiple={false}
            classNames={{
              popup: {
                root: 'cascader-popup-wrapper gpu-selector'
              }
            }}
            maxTagCount={1}
            label={intl.formatMessage({ id: 'resources.worker' })}
            options={workerOptions}
            showCheckedStrategy="SHOW_CHILD"
            optionNode={renderOptionNode}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          ></SealCascader>
        </Form.Item>
        {source !== modelSourceMap.local_path_value && (
          <Form.Item<FormData>
            name="local_dir"
            rules={[
              {
                required: false,
                message: getRuleMessage(
                  'input',
                  'resources.modelfiles.form.localdir'
                )
              }
            ]}
          >
            <SealInput.Input
              description={
                <span
                  dangerouslySetInnerHTML={{
                    __html: intl.formatMessage({
                      id: 'resources.modelfiles.form.localdir.tips'
                    })
                  }}
                ></span>
              }
              label={intl.formatMessage({
                id: 'resources.modelfiles.form.localdir'
              })}
            ></SealInput.Input>
          </Form.Item>
        )}
      </Form>
    </div>
  );
});

export default TargetForm;
