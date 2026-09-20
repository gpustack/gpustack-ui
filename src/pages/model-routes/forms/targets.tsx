import { PageAction } from '@/config';
import ProviderLogo from '@/pages/maas-provider/components/provider-logo';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  AutoTooltip,
  CollapseContainer,
  IconFont,
  InputNumber,
  Cascader as SealCascader,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { LB_FORM_MODE } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import useTargetSourceModels from '../hooks/use-target-source-models';
const OptionWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  .lora-tag {
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
  }
`;

const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// stands in for a selected target's title on the collapsed card header,
// matching the kv-cache form's L2 storage backend entry title (createStyles,
// per the no-new-styled-components rule; the two above are legacy).
const useStyles = createStyles(({ css }) => ({
  // Typography for the section heading's title span. The row layout itself
  // is an antd Flex at the usage site (no hand-written display:flex per the
  // layout convention). `advancedToggle` styles a Button's own chrome and
  // stays here.
  sectionTitle: css`
    font-size: 14px;
    font-weight: 600;
  `,
  // Full-row "show more" affordance for the optional per-target fields: thin,
  // dashed, quiet until hovered, so it reads as a seam in the card rather than
  // as a third action next to the real controls. Shown only while they are
  // hidden — clicking it hands its row over to the fields it reveals.
  advancedToggle: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
  `
}));

// Form.Item clones its child with value/onChange; a plain DOM node would
// surface them as unknown-attribute warnings, so render through this
// pass-through component like MetadataList did before.
const ListContainer = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const TargetsForm = forwardRef((props, ref) => {
  const { onFallbackChange, action } = useFormContext();
  const intl = useIntl();
  const { styles } = useStyles();
  const { getRuleMessage } = useAppUtils();
  const { sourceModels, fetchSourceModels } = useTargetSourceModels();
  const [validTriggered, setValidTriggered] = useState<boolean>(false);
  const form = Form.useFormInstance<FormData>();
  const targets = Form.useWatch('targets', form) || [];
  const lbPolicyMode = Form.useWatch('lb_policy_mode', form);
  // `=== policy`, not `!== weighted`: Form.useWatch returns undefined on the
  // first frame (it initializes in an effect), and undefined should fall to
  // weighted — the create-flow default — instead of flashing the weight
  // inputs / Segmented state off and back on each time the drawer opens.
  const isSmartMode = lbPolicyMode === LB_FORM_MODE.policy;
  const fallbackCacheRef = useRef<{ value: any[] }>({ value: [] });
  const [fallbackValues, setFallbackValues] = useState<{ value: any[] }>({
    value: []
  });
  const [dataList, setDataList] = useState<
    {
      weight: number | null;
      value: any[];
    }[]
  >([]);
  // Which target cards are expanded / show their advanced fields
  // (index-based, like the kv-cache form's L2 collapse keys).
  const [collapseKeys, setCollapseKeys] = useState<Set<number>>(new Set());
  const [advancedKeys, setAdvancedKeys] = useState<Set<number>>(new Set());

  const toggleKey = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    index: number,
    on: boolean
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (on) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    initFallbackValues: (values: { value: any[] }) => {
      setFallbackValues(values);
      fallbackCacheRef.current = values;
    },
    initDataList: (
      list: {
        weight: number | null;
        value: any[];
      }[]
    ) => {
      setDataList(list);
      // the caller fills the form before handing over the list, so a target
      // that already carries advanced values opens with them visible —
      // otherwise editing a route would silently hide what it is set to
      const seeded = new Set<number>();
      (form.getFieldValue('targets') || []).forEach(
        (target: any, index: number) => {
          if (target?.max_running_requests != null) {
            seeded.add(index);
          }
        }
      );
      setAdvancedKeys(seeded);
    }
  }));

  const handleTargetsChange = (value: any[], index: number, options: any[]) => {
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};
    const targetList = [...targets];
    targetList[index] = {
      weight: targetList[index]?.weight,
      ...selectedOption?.data
    };

    form.setFieldValue('targets', [...targetList]);

    const newDataList = [...dataList];
    newDataList[index] = {
      weight: newDataList[index]?.weight || null,
      value: value
    };
    form.validateFields(['targets']);
    setDataList(newDataList);
  };

  const handleOnAdd = () => {
    const newDataList = [
      ...dataList,
      {
        weight: 100,
        value: []
      }
    ];
    setDataList(newDataList);
    const newTargets = [
      ...targets,
      {
        weight: 100,
        value: []
      }
    ];

    form.setFieldValue('targets', newTargets);
    // the new entry opens for immediate editing; cards already expanded stay
    // expanded (a wholesale new Set would collapse them)
    setCollapseKeys((prev) => new Set([...prev, dataList.length]));
  };

  const handleOnDelete = (index: number, item: any) => {
    const newDataList = dataList.filter((_, i) => i !== index);
    setDataList(newDataList);

    const targetList = [...targets];
    targetList.splice(index, 1);
    form.setFieldValue('targets', [...targetList]);
    // keep open/advanced cards attached to the entries they belong to
    const shiftKeys = (keys: Set<number>) => {
      const next = new Set<number>();
      keys.forEach((key) => {
        if (key < index) {
          next.add(key);
        } else if (key > index) {
          next.add(key - 1);
        }
      });
      return next;
    };
    setCollapseKeys(shiftKeys);
    setAdvancedKeys(shiftKeys);
  };

  // adjacent moves are index swaps across both the row list and the form
  const handleMoveTarget = (from: number, to: number) => {
    const newDataList = [...dataList];
    const [moved] = newDataList.splice(from, 1);
    newDataList.splice(to, 0, moved);
    setDataList(newDataList);

    const targetList = [...targets];
    const [movedTarget] = targetList.splice(from, 1);
    targetList.splice(to, 0, movedTarget);
    form.setFieldValue('targets', [...targetList]);
    const swapKeys = (keys: Set<number>) => {
      const next = new Set<number>();
      keys.forEach((key) => {
        next.add(key === from ? to : key === to ? from : key);
      });
      return next;
    };
    setCollapseKeys(swapKeys);
    setAdvancedKeys(swapKeys);
  };

  // Collapsed-card title: the selected provider / model labels resolved
  // from the cascader options tree.
  const resolveEntryTitle = (value: any[]) => {
    if (!value || value.length === 0) {
      return intl.formatMessage({ id: 'providers.form.target.placeholder' });
    }
    const parent = sourceModels.find((model: any) => model.value === value[0]);
    const child = parent?.children?.find(
      (item: any) => item.value === value[1]
    );
    return child?.label
      ? `${parent?.label ? `${parent.label} / ` : ''}${child.label}`
      : intl.formatMessage({ id: 'providers.form.target.placeholder' });
  };

  const handleFallbackChange = (value: any[], options?: any[]) => {
    if (!value || value.length === 0) {
      form.setFieldValue('fallback_target', null);
      setFallbackValues({
        value: []
      });
      return;
    }
    const selectedOption =
      options?.find?.((opt) => opt.value === value[1]) || {};

    form.setFieldValue('fallback_target', {
      ...selectedOption?.data
    });
    setFallbackValues({
      value: value
    });
    if (action === PageAction.EDIT) {
      const isEqual = _.isEqual(fallbackCacheRef.current.value, value);
      onFallbackChange?.(!isEqual);
    }
  };

  const handleOnWeightChange = (value: any, index: number) => {
    const weight = value || 0;
    const targetList = [...targets];
    if (targetList[index]) {
      targetList[index] = {
        ...targetList[index],
        weight: weight
      };
      form.setFieldValue('targets', [...targetList]);
    }

    const newDataList = [...dataList];
    newDataList[index] = {
      ...newDataList[index],
      weight: weight
    };
    form.validateFields(['targets']);
    setDataList(newDataList);
  };

  const handleAdvancedChange = (
    index: number,
    patch: { max_running_requests?: number | null }
  ) => {
    const targetList = [...targets];
    if (targetList[index]) {
      targetList[index] = { ...targetList[index], ...patch };
      form.setFieldValue('targets', [...targetList]);
    }
  };

  const buildKey = (path?: any[]) =>
    Array.isArray(path) ? path.join('/') : '';

  const filterOptions = (currentValue: any[]) => {
    const currKey = buildKey(currentValue);

    const selectedDataList = [...dataList, { value: fallbackValues.value }];

    const selectedKeys = new Set(
      selectedDataList
        .filter((item) => item.value)
        .map((item) => buildKey(item.value))
    );

    return sourceModels
      .map((model) => {
        const children = model.children?.filter((child) => {
          const key = buildKey([child.data?.parentId, child.value]);

          return !selectedKeys.has(key) || key === currKey;
        });

        return {
          ...model,
          children
        };
      })
      .filter((model) => model.children && model.children.length > 0);
  };

  const displayRender = (labels: any[], option: any) => {
    return (
      <LabelWrapper>
        <ProviderLogo provider={_.get(option, '0.providerType') as string} />
        <AutoTooltip
          ghost
          maxWidth={300}
          title={
            <span>
              {labels[0]} / {labels[1]}
            </span>
          }
        >
          <span>
            {labels[0]} / {labels[1]}
          </span>
        </AutoTooltip>
      </LabelWrapper>
    );
  };

  const optionRender = (option: any) => {
    const { data } = option;

    if (!data.isParent) {
      if (data.isLora) {
        return (
          <OptionWrapper>
            <AutoTooltip ghost>{data.label}</AutoTooltip>
            <span className="lora-tag">[LoRA]</span>
          </OptionWrapper>
        );
      }
      return <AutoTooltip ghost>{data.label}</AutoTooltip>;
    }

    if (data.providerType === 'deployments') {
      return (
        <OptionWrapper>
          <ProviderLogo provider={data.providerType as string} />
          <AutoTooltip ghost maxWidth={105}>
            {intl.formatMessage({ id: 'menu.models.deployment' })}
          </AutoTooltip>
        </OptionWrapper>
      );
    }

    return (
      <OptionWrapper>
        <ProviderLogo provider={data.providerType as string} />
        <AutoTooltip ghost maxWidth={105}>
          <span>{data.label}</span>
        </AutoTooltip>
      </OptionWrapper>
    );
  };

  useEffect(() => {
    fetchSourceModels();
  }, []);

  useEffect(() => {
    if (action === PageAction.CREATE) {
      handleOnAdd();
    }
  }, [action]);

  return (
    <>
      <Form.Item
        name="targets"
        data-field="targets"
        trigger=""
        rules={[
          {
            validator(rule, value) {
              if (value && value?.length > 0) {
                if (
                  _.some(
                    dataList,
                    (item: any) => !item.value || item.value.length === 0
                  )
                ) {
                  setValidTriggered(true);
                  return Promise.reject(
                    getRuleMessage('input', 'providers.form.target.placeholder')
                  );
                }
                // Weighted mode: every target must carry weight>0. Mixing
                // weighted and unweighted targets yields lb_mode "invalid"
                // and the gateway refuses to render the route.
                if (
                  !isSmartMode &&
                  _.some(value, (target: any) => !(target?.weight > 0))
                ) {
                  setValidTriggered(true);
                  return Promise.reject(
                    intl.formatMessage({ id: 'routes.lb.weight.mixed' })
                  );
                }
              }
              setValidTriggered(false);
              return Promise.resolve();
            }
          }
        ]}
      >
        <ListContainer>
          {/* Heading row: layout via antd Flex, typography via sectionTitle. */}
          <Flex
            justify="space-between"
            align="center"
            style={{
              minHeight: 40,
              marginBottom: 10,
              paddingInline: 5
            }}
          >
            <span className={styles.sectionTitle}>
              {intl.formatMessage({ id: 'routes.form.target.title' })}
            </span>
            <Button type="link" onClick={handleOnAdd}>
              <PlusOutlined />
              {intl.formatMessage({ id: 'routes.form.target.add' })}
            </Button>
          </Flex>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {dataList.map((item, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--ant-color-split)',
                  borderRadius: 'var(--ant-border-radius-lg)'
                }}
              >
                <CollapseContainer
                  collapsible={true}
                  showExpandIcon={true}
                  open={collapseKeys.has(index)}
                  onToggle={(open: boolean) =>
                    toggleKey(setCollapseKeys, index, open)
                  }
                  styles={{
                    body: collapseKeys.has(index)
                      ? { paddingBlock: 16, paddingInline: 16 }
                      : {},
                    content: { paddingTop: 0 },
                    header: { backgroundColor: 'unset' }
                  }}
                  title={
                    <Flex
                      align="center"
                      gap={4}
                      style={{ color: 'var(--ant-color-text-secondary)' }}
                    >
                      <span>{resolveEntryTitle(item.value)}</span>
                      {!isSmartMode && (
                        <span
                          style={{
                            fontSize: 12,
                            color: 'var(--ant-color-text-tertiary)'
                          }}
                        >
                          ·
                          {intl.formatMessage({
                            id: 'routes.form.target.weight'
                          })}
                          : {item.weight ?? 0}
                        </span>
                      )}
                    </Flex>
                  }
                  right={
                    <span
                      className="flex-center gap-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dataList.length > 1 && (
                        <>
                          <Button
                            size="small"
                            shape="circle"
                            disabled={index === 0}
                            aria-label={intl.formatMessage({
                              id: 'routes.form.target.moveUp'
                            })}
                            onClick={() => handleMoveTarget(index, index - 1)}
                          >
                            <ArrowUpOutlined />
                          </Button>
                          <Button
                            size="small"
                            shape="circle"
                            disabled={index === dataList.length - 1}
                            aria-label={intl.formatMessage({
                              id: 'routes.form.target.moveDown'
                            })}
                            onClick={() => handleMoveTarget(index, index + 1)}
                          >
                            <ArrowDownOutlined />
                          </Button>
                        </>
                      )}
                      <Button
                        size="small"
                        shape="circle"
                        aria-label={intl.formatMessage({
                          id: 'routes.form.target.remove'
                        })}
                        onClick={() => handleOnDelete(index, item)}
                      >
                        <MinusOutlined />
                      </Button>
                    </span>
                  }
                >
                  {/* model selection + weight on one row */}
                  <div className="flex-center" style={{ gap: 8 }}>
                    <SealCascader
                      required
                      showSearch
                      status={
                        (!item.value || item.value.length === 0) &&
                        validTriggered
                          ? 'error'
                          : 'success'
                      }
                      expandTrigger="hover"
                      multiple={false}
                      alwaysFocus={true}
                      onChange={(value, options) =>
                        handleTargetsChange(value, index, options)
                      }
                      classNames={{
                        popup: {
                          root: 'cascader-popup-floating gpu-selector'
                        }
                      }}
                      styles={{
                        popup: {
                          listItem: {
                            padding: '5px 10px'
                          }
                        }
                      }}
                      maxTagCount={1}
                      placeholder={intl.formatMessage({
                        id: 'providers.form.target.placeholder'
                      })}
                      value={item.value}
                      options={filterOptions(item.value)}
                      showCheckedStrategy="SHOW_CHILD"
                      displayRender={displayRender}
                      optionNode={optionRender}
                      // attach to body: the collapse body animates its height
                      // with overflow: hidden, which clips a popup parented to
                      // the field itself. Pairs with `cascader-popup-floating`
                      // — the pinned popup class would place a body-rendered
                      // popup in the viewport's top-left corner.
                      getPopupContainer={() => document.body}
                    ></SealCascader>
                    {/* Weight only exists in weighted mode — round-robin and
                        policy hand every target to the gateway's picker with
                        weight 0, so the field has nothing to say there. The
                        value survives in the form, so switching back restores
                        what was typed. */}
                    {!isSmartMode && (
                      <Tooltip
                        title={intl.formatMessage({
                          id: 'routes.form.weight.tips'
                        })}
                      >
                        <div style={{ flex: 'none' }}>
                          <InputNumber
                            label={intl.formatMessage({
                              id: 'routes.form.target.weight'
                            })}
                            min={0}
                            controls={false}
                            status={
                              item.weight === null && validTriggered
                                ? 'error'
                                : 'success'
                            }
                            value={item.weight}
                            onChange={(value) =>
                              handleOnWeightChange(value, index)
                            }
                          ></InputNumber>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  {/* one-shot: reveals the advanced fields and steps aside */}
                  {!advancedKeys.has(index) && (
                    <Button
                      type="dashed"
                      size="small"
                      block
                      className={styles.advancedToggle}
                      onClick={() => toggleKey(setAdvancedKeys, index, true)}
                    >
                      {intl.formatMessage({
                        id: 'routes.form.target.advanced'
                      })}
                      <IconFont type="icon-down" style={{ fontSize: 12 }} />
                    </Button>
                  )}
                  {advancedKeys.has(index) && (
                    <div style={{ marginTop: 12 }}>
                      <InputNumber
                        label={intl.formatMessage({
                          id: 'routes.form.target.maxRunningRequests'
                        })}
                        min={1}
                        precision={0}
                        controls={false}
                        style={{ width: '100%' }}
                        value={targets[index]?.max_running_requests ?? null}
                        onChange={(value: any) =>
                          handleAdvancedChange(index, {
                            max_running_requests: (value as number) ?? null
                          })
                        }
                      />
                    </div>
                  )}
                </CollapseContainer>
              </div>
            ))}
          </div>
        </ListContainer>
      </Form.Item>
      <Form.Item name="fallback_target">
        <div>
          <SealCascader
            showSearch
            expandTrigger="hover"
            multiple={false}
            alwaysFocus={true}
            classNames={{
              popup: {
                root: 'cascader-popup-floating gpu-selector'
              }
            }}
            styles={{
              popup: {
                listItem: {
                  padding: '5px 10px'
                }
              }
            }}
            label={intl.formatMessage({
              id: 'routes.form.target.fallback'
            })}
            placeholder={intl.formatMessage({
              id: 'providers.form.target.placeholder'
            })}
            maxTagCount={1}
            value={fallbackValues.value}
            options={filterOptions(fallbackValues.value)}
            onChange={(value, options) => handleFallbackChange(value, options)}
            showCheckedStrategy="SHOW_CHILD"
            displayRender={displayRender}
            optionNode={optionRender}
            getPopupContainer={() => document.body}
          ></SealCascader>
        </div>
      </Form.Item>
    </>
  );
});

export default TargetsForm;
