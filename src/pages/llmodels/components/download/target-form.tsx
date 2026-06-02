import PluginExtraFields from '@/components/plugin-extra-fields';
import { ModelFileFormData as FormData } from '@/pages/resources/config/types';
import {
  Input as CInput,
  Cascader as SealCascader,
  Select as SealSelect,
  TooltipList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import minimatch from 'minimatch';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { localPathTipsList, modelSourceMap, sourceOptions } from '../../config';
import { useGenerateWorkersModelFileOptions } from '../../hooks';

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
  // Owned by the create-scope picker slot (admin "All" view). When set, scope
  // the worker picker to clusters owned by that org — a model file's owner is
  // derived from the target worker's cluster, so this keeps them aligned.
  const scopeOrgId = Form.useWatch('organization_id', form);
  const prevScopeRef = useRef<number | null | undefined>(undefined);

  const visibleWorkerOptions = useMemo(() => {
    if (scopeOrgId == null) {
      return workerOptions;
    }
    return (workerOptions || []).filter(
      (cluster: any) => cluster.owner_principal_id === scopeOrgId
    );
  }, [workerOptions, scopeOrgId]);

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

  // On a genuine org change, drop the now-out-of-scope worker selection.
  useEffect(() => {
    if (prevScopeRef.current === undefined) {
      prevScopeRef.current = scopeOrgId;
      return;
    }
    if (prevScopeRef.current === scopeOrgId) {
      return;
    }
    prevScopeRef.current = scopeOrgId;
    form.setFieldValue('worker_id', undefined);
  }, [scopeOrgId]);

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
          <CInput.Input
            required
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            onBlur={handleOnLocalPathBlur}
            description={<TooltipList list={localPathTipsList}></TooltipList>}
          ></CInput.Input>
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
        <PluginExtraFields
          name="CreateOrgScopeField"
          context={{ action: 'create' }}
        />
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
            styles={{
              popup: {
                listItem: {
                  maxWidth: '100%'
                }
              }
            }}
            maxTagCount={1}
            label={intl.formatMessage({ id: 'resources.worker' })}
            options={visibleWorkerOptions}
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
            <CInput.Input
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
            ></CInput.Input>
          </Form.Item>
        )}
      </Form>
    </div>
  );
});

export default TargetForm;
