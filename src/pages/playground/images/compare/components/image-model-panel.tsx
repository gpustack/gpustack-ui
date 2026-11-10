import {
  ClearOutlined,
  DeleteOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { AlertInfo, IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Checkbox, Flex, MenuProps } from 'antd';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CREAT_IMAGE_API } from '../../../apis';
import ThumbImg from '../../../components/thumb-img';
import ViewCommonCode from '../../../components/view-common-code';
import { useInitImageMeta } from '../../../hooks/use-init-image';
import useTextImage from '../../../hooks/use-text-image';
import { generateImageCode } from '../../../view-code/image';
import DataForm from '../../forms';
import {
  buildImageParameters,
  getImageParameterErrors,
  normalizeImageParameters
} from '../../parameters';
import { imageParameterLabels } from '../config';
import { ImageComparisonHandle, PreparedImageRun } from '../config/types';
import ComparisonPanel from './comparison-panel';
import styles from './image-model-panel.module.less';

interface ImageModelPanelProps {
  model: string;
  modelList: Global.BaseOption<string>[];
  instanceId: symbol;
  prompt: string;
  canDelete: boolean;
  onDelete: (instanceId: symbol) => void;
  onLoadingChange: (instanceId: symbol, loading: boolean) => void;
  onApplyParameters: (parameters: Record<string, any>) => void;
}

function ImageModelPanel(
  props: ImageModelPanelProps,
  ref: React.ForwardedRef<ImageComparisonHandle>
) {
  const intl = useIntl();
  const revision = useRef(0);
  const applyToAll = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [showCode, setShowCode] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const {
    form,
    parameters,
    initialValues,
    paramsConfig,
    modelMeta,
    imageSizeOptions,
    handleOnModelChange,
    handleOnValuesChange,
    applyParameters,
    setParams
  } = useInitImageMeta(props, { type: 'create' });
  const {
    imageList,
    tokenResult,
    submitMessage,
    handleClear,
    handleStopConversation
  } = useTextImage({
    API: CREAT_IMAGE_API,
    scroller,
    onLoadingChange: (running: boolean) =>
      props.onLoadingChange(props.instanceId, running)
  });

  const validateParameters = (values: Record<string, any>) =>
    getImageParameterErrors(
      { ...parameters, ...values, model: parameters.model, n: 1 },
      modelMeta,
      imageSizeOptions
    );

  const clear = () => {
    revision.current += 1;
    handleClear();
    setInvalidFields([]);
  };

  const abortFetch = () => {
    revision.current += 1;
    handleStopConversation();
  };

  const prepare = async (
    prompt: string
  ): Promise<PreparedImageRun | null | false> => {
    if (!parameters.model) return null;
    const currentRevision = revision.current;
    const snapshot = { ...parameters, n: 1 };
    const fields = validateParameters(snapshot);
    setInvalidFields(fields);
    if (fields.length) return false;
    try {
      await form.current?.form?.validateFields();
    } catch {
      return false;
    }
    if (currentRevision !== revision.current) return false;
    return {
      parameters: buildImageParameters(snapshot, prompt),
      revision: currentRevision
    };
  };

  const submit = (run: PreparedImageRun) => {
    if (
      run.revision !== revision.current ||
      run.parameters.model !== parameters.model
    )
      return;
    setParams((previous: Record<string, any>) => ({
      ...previous,
      seed: run.parameters.seed
    }));
    form.current?.form?.setFieldValue('seed', run.parameters.seed);
    void submitMessage(run.parameters);
  };

  const applySharedParameters = (values: Record<string, any>) => {
    revision.current += 1;
    setInvalidFields([]);
    applyParameters(values);
  };

  useImperativeHandle(ref, () => ({
    instanceId: props.instanceId,
    prepare,
    submit,
    clear,
    abortFetch,
    getParameters: () => parameters,
    validateParameters,
    applyParameters: applySharedParameters
  }));

  const changeModel = (value: string) => {
    clear();
    handleOnModelChange(value);
  };

  const changeParameters = (
    changed: Record<string, any>,
    values: Record<string, any>
  ) => {
    revision.current += 1;
    setInvalidFields([]);
    handleOnValuesChange(changed, { ...values, model: parameters.model });
    if (applyToAll.current) {
      props.onApplyParameters({
        ...parameters,
        ...values,
        ...(changed.size === 'custom'
          ? {
              width: modelMeta.default_width || 512,
              height: modelMeta.default_height || 512
            }
          : {})
      });
    }
  };

  const actions: MenuProps['items'] = [
    {
      key: 'clear',
      label: intl.formatMessage({ id: 'common.button.clear' }),
      icon: <ClearOutlined />,
      onClick: clear
    },
    {
      key: 'code',
      label: intl.formatMessage({ id: 'playground.viewcode' }),
      icon: <IconFont type="icon-code" />,
      onClick: () => setShowCode(true)
    }
  ];
  if (props.canDelete)
    actions.push({
      key: 'delete',
      label: intl.formatMessage({ id: 'common.button.delete' }),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => props.onDelete(props.instanceId)
    });

  return (
    <ComparisonPanel
      model={parameters.model}
      modelList={props.modelList}
      onModelChange={changeModel}
      actions={actions}
      parameters={
        <DataForm
          ref={form}
          meta={modelMeta}
          modelList={props.modelList}
          initialValues={initialValues}
          paramsConfig={paramsConfig}
          onValuesChange={changeParameters}
          showModelSelector={false}
          parametersTitle={
            <Flex align="center" justify="space-between" gap="small">
              <span>{intl.formatMessage({ id: 'playground.parameters' })}</span>
              <Checkbox
                onChange={(event) => {
                  applyToAll.current = event.target.checked;
                  if (event.target.checked) props.onApplyParameters(parameters);
                }}
              >
                {intl.formatMessage({ id: 'playground.compare.applytoall' })}
              </Checkbox>
            </Flex>
          }
        />
      }
    >
      <Flex vertical gap="small" className={styles.content}>
        <div className={styles.results} ref={scroller}>
          <div style={{ height: '100%' }}>
            {imageList.length ? (
              <ThumbImg
                dataList={imageList.slice(0, 1)}
                editable={false}
                autoBgColor={false}
                autoSize
                style={{
                  padding: 0,
                  height: '100%',
                  flexDirection: 'column',
                  flexWrap: 'nowrap'
                }}
              />
            ) : (
              <Flex
                vertical
                align="center"
                justify="center"
                gap="middle"
                className={styles.empty}
              >
                <FileImageOutlined style={{ fontSize: 32 }} />
                <span>
                  {intl.formatMessage({ id: 'playground.params.empty.tips' })}
                </span>
              </Flex>
            )}
          </div>
        </div>
        {invalidFields.length > 0 && (
          <AlertInfo
            type="danger"
            message={intl.formatMessage(
              { id: 'playground.image.compare.invalidParameters' },
              {
                fields: invalidFields
                  .map((field) =>
                    intl.formatMessage({ id: imageParameterLabels[field] })
                  )
                  .join(', ')
              }
            )}
          />
        )}
        {tokenResult && (
          <AlertInfo type="danger" message={tokenResult.errorMessage} />
        )}
      </Flex>
      <ViewCommonCode
        open={showCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
        onCancel={() => setShowCode(false)}
        viewCodeContent={generateImageCode({
          api: CREAT_IMAGE_API,
          parameters: {
            ...normalizeImageParameters(parameters),
            n: 1,
            prompt: props.prompt
          }
        })}
      />
    </ComparisonPanel>
  );
}

export default forwardRef(ImageModelPanel);
