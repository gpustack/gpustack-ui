import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useUserSettings from '@/hooks/use-user-settings';
import { json2Yaml } from '@/pages/backends/config';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Input as CInput, IconFont } from '@gpustack/core-ui';
import { YamlEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Tooltip, Typography } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import styled from 'styled-components';
import DefaultRegistryField from '../components/default-registry-field';
import {
  GpuServiceSettingsForm,
  OperatorImageForm
} from '../components/k8s-pod-spec';
import { ProviderType, ProviderValueMap } from '../config';
import { useStepsContext } from '../config/steps-context';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import dockerSchema from '../config/worker-config.docker.json';
import kubernetesSchema from '../config/worker-config.kubernetes.json';
import {
  chartValuesTemplate,
  dockerConfig,
  kubernetesConfig
} from '../config/yaml-template';
import { parseHelmValues } from '../utils/helm-values';

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  font-size: 14px;
  padding-top: 0px;
  height: 56px;
  padding-bottom: 8px;
`;

// Field-level prose under a Title. `Paragraph` carries the bottom margin so
// the notes keep the same rhythm as the fields above them.
const Description: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <Typography.Paragraph
    type="secondary"
    style={{ fontSize: 13, marginBottom: 8, ...style }}
  >
    {children}
  </Typography.Paragraph>
);

const ClusterAdvanceConfig: React.FC<{
  action: PageActionType;
  provider: ProviderType;
  currentData?: ListItem;
  // Fires once, the first time the user edits Chart Values. That text never
  // enters the form store, so `K8sOptionsChangeWatcher` cannot see it — this
  // is what still gets the footer's "re-run registration" notice shown for a
  // change that does require reapplying the manifest.
  onChartValuesDirty?: () => void;
  ref?: any;
}> = forwardRef(
  ({ action, provider, currentData, onChartValuesDirty }, ref) => {
    const [form] = Form.useForm();
    const intl = useIntl();
    // Present only inside the create wizard; see StepsContext.
    const { chartValuesDraft } = useStepsContext();
    const editorRef = React.useRef<any>(null);
    const chartValuesRef = React.useRef<any>(null);
    const { isDarkTheme } = useUserSettings();
    const [fileContent, setFileContent] = React.useState<string>('');
    const [chartValuesContent, setChartValuesContent] =
      React.useState<string>('');
    // Covers both the local parse failure and the backend's 422 about a rejected
    // path — one slot, because only one of them can be the current reason the
    // field is wrong.
    const [chartValuesError, setChartValuesError] = React.useState<string>('');
    const chartValuesSeeded = React.useRef(false);
    const chartValuesDirty = React.useRef(false);
    const schema =
      provider === ProviderValueMap.Kubernetes
        ? kubernetesSchema
        : dockerSchema;
    const isKubernetes = provider === ProviderValueMap.Kubernetes;

    useImperativeHandle(ref, () => ({
      getYamlValue: () => {
        return editorRef.current?.getValue();
      },
      setYamlValue: (values: any) => {
        editorRef.current?.setValue(
          values ||
            (provider === ProviderValueMap.Kubernetes
              ? kubernetesConfig
              : dockerConfig)
        );
      },
      // Reports the backend's own message for this field; the rejected paths
      // track the chart, so the server's list is the only correct one.
      setChartValuesError,
      // Throws on invalid YAML (or a non-mapping document) after showing the
      // reason under the editor, so the caller can abort before requesting.
      // Returns `null` for empty input — the field is then omitted rather than
      // sent as an empty object.
      getChartValues: () => {
        if (!isKubernetes) return undefined;
        // monaco is lazy-loaded, so `getValue()` is `undefined` for the first
        // few hundred ms — submitting inside that window would read the editor
        // as empty and send `helmValues: null`, wiping a stored override. Fall
        // back to the text we seeded it with. `??`, not `||`: an editor the
        // user really did empty returns `''` and must not fall back.
        const text = chartValuesRef.current?.getValue() ?? chartValuesContent;
        try {
          const values = parseHelmValues(text, {
            invalidYaml: (reason) =>
              intl.formatMessage(
                { id: 'clusters.chartValues.error.invalidYaml' },
                { reason }
              ),
            notMapping: intl.formatMessage({
              id: 'clusters.chartValues.error.notMapping'
            }),
            notJson: (path) =>
              intl.formatMessage(
                { id: 'clusters.chartValues.error.notJson' },
                { path }
              ),
            unsafeInteger: (path) =>
              intl.formatMessage(
                { id: 'clusters.chartValues.error.unsafeInteger' },
                { path }
              )
          });
          setChartValuesError('');
          return values;
        } catch (e) {
          setChartValuesError((e as Error).message);
          throw e;
        }
      }
    }));

    useEffect(() => {
      // Seeded from `currentData` whatever the action. The wizard is a CREATE
      // that still has a previous value to come back to: it unmounts this form
      // between steps and hands it back its own `validateFields` payload, so
      // branching on the action would send a revisit to the template and lose
      // what the user wrote.
      //
      // `worker_config` is an object on the wire — monaco's `createModel` only
      // accepts a string, so serialize it before it reaches the editor.
      //
      // Declarative on purpose: this writes through `value={fileContent}` and
      // the dependency only changes when the data does. ClusterForm used to
      // push the same text imperatively on every render, which overwrote
      // whatever was being typed.
      const template =
        provider === ProviderValueMap.Kubernetes
          ? kubernetesConfig
          : dockerConfig;
      const workerConfig = currentData?.worker_config;
      setFileContent(
        workerConfig && Object.keys(workerConfig).length > 0
          ? json2Yaml(workerConfig)
          : template
      );
    }, [provider, currentData?.worker_config]);

    useEffect(() => {
      if (!isKubernetes || chartValuesSeeded.current) return;
      // On edit the cluster arrives asynchronously, so hold the seed until it is
      // here — otherwise the first paint's empty template is what sticks.
      if (action === PageAction.EDIT && !currentData) return;

      // Seeded once per mount, never re-synced: the stored value is an object,
      // so re-seeding from it mid-edit would replace the user's own text
      // (comments, key order) with a re-serialization of what they just typed.
      //
      // The wizard unmounts this form when it moves to the next step, so a
      // remount *is* a revisit — and the only value it could re-seed from is
      // that same parsed object. `chartValuesDraft` carries the raw text
      // across instead and is preferred here; the parsed value stays as the
      // fallback for the edit drawer, which has no draft because it never
      // unmounts.
      chartValuesSeeded.current = true;
      const draft = chartValuesDraft?.current;
      if (draft != null) {
        setChartValuesContent(draft);
        return;
      }
      const helmValues = currentData?.k8s_options?.helmValues;
      setChartValuesContent(
        helmValues && Object.keys(helmValues).length > 0
          ? json2Yaml(helmValues)
          : chartValuesTemplate
      );
    }, [isKubernetes, action, currentData]);

    return (
      <>
        <Form.Item<FormData>
          hidden
          name="worker_config"
          rules={[
            {
              required: false,
              message: ''
            }
          ]}
        >
          <CInput.TextArea required={false} trim={false}></CInput.TextArea>
        </Form.Item>
        {/* Shuihua renders this field in the basic form instead, where it is
          mandatory — see `components/default-registry-field`. */}
        {provider !== ProviderValueMap.Shuihua && (
          <DefaultRegistryField provider={provider} />
        )}
        {provider === ProviderValueMap.Kubernetes && (
          <>
            <OperatorImageForm />
            <GpuServiceSettingsForm />
          </>
        )}
        <Title>
          {intl.formatMessage({ id: 'clusters.create.workerConfig' })}
        </Title>
        <YamlEditor
          ref={editorRef}
          isDarkTheme={isDarkTheme}
          title={
            <span className="flex-center">
              <span>{`YAML`}</span>
              <Button
                size="small"
                type="link"
                target="_blank"
                href="https://docs.gpustack.ai/latest/cli-reference/start/#config-file"
              >
                {intl.formatMessage({ id: 'playground.audio.enablemic.doc' })}{' '}
                <IconFont
                  type="icon-external-link"
                  className="font-size-14"
                ></IconFont>
              </Button>
            </span>
          }
          value={fileContent}
          height={300}
          onUpload={(content) => {
            setFileContent(content);
          }}
          schema={schema}
        ></YamlEditor>
        {isKubernetes && (
          <>
            <Title>
              <Flex align="center" gap={6}>
                {intl.formatMessage({ id: 'clusters.chartValues.title' })}
                <Tooltip
                  title={intl.formatMessage({ id: 'clusters.chartValues.tip' })}
                >
                  <QuestionCircleOutlined
                    style={{
                      color: 'var(--ant-color-text-tertiary)',
                      cursor: 'help'
                    }}
                  />
                </Tooltip>
              </Flex>
            </Title>
            <YamlEditor
              ref={chartValuesRef}
              isDarkTheme={isDarkTheme}
              // Its own monaco model: leaving both editors on the default path
              // makes them share one model, and one editor's text shows up in
              // the other.
              path="inmemory://model/chart-values.yaml"
              title={
                <span className="flex-center">
                  <span>{`YAML`}</span>
                  <Button
                    size="small"
                    type="link"
                    target="_blank"
                    href="https://github.com/gpustack/gpustack/blob/main/charts/gpustack-chart/values.yaml"
                  >
                    {intl.formatMessage({
                      id: 'clusters.chartValues.doc.chart'
                    })}{' '}
                    <IconFont
                      type="icon-external-link"
                      className="font-size-14"
                    ></IconFont>
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    target="_blank"
                    href="https://github.com/gpustack/gpustack-operator"
                  >
                    {intl.formatMessage({
                      id: 'clusters.chartValues.doc.operator'
                    })}{' '}
                    <IconFont
                      type="icon-external-link"
                      className="font-size-14"
                    ></IconFont>
                  </Button>
                </span>
              }
              value={chartValuesContent}
              // Tall enough to show the placeholder down to its Kueue/NFD
              // warning without scrolling — that comment block is the only place
              // the warning is stated.
              height={340}
              validateMessage={chartValuesError}
              onChange={(value) => {
                // Only user edits land here: @monaco-editor/react guards the
                // change event while it applies a new `value` prop, so seeding
                // the editor does not count as dirtying it.
                if (chartValuesDraft) {
                  chartValuesDraft.current = value ?? '';
                }
                if (!chartValuesDirty.current) {
                  chartValuesDirty.current = true;
                  onChartValuesDirty?.();
                }
                // The message described the text that was there when it was
                // raised; keeping it while the user edits would be a lie.
                if (chartValuesError) setChartValuesError('');
              }}
              onUpload={(content) => {
                setChartValuesContent(content);
                if (chartValuesDraft) {
                  chartValuesDraft.current = content;
                }
                setChartValuesError('');
              }}
            ></YamlEditor>
            <Description style={{ marginTop: 8, marginBottom: 0 }}>
              {intl.formatMessage({ id: 'clusters.chartValues.reapply.tip' })}
            </Description>
          </>
        )}
        <div className="scroller-to-holder" style={{ height: 1 }}></div>
      </>
    );
  }
);

export default ClusterAdvanceConfig;
