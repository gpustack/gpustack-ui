import {
  AutoComplete,
  CheckboxField,
  Input as CInput,
  InputNumber as CInputNumber,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Switch, Tooltip } from 'antd';
import _ from 'lodash';
import { useMemo, useRef } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import { backendOptionsMap } from '../constants/backend-parameters';
import useQueryDraftModels from '../hooks/use-query-draftModels';
import { RoleSection } from './roles/override-section';

const AlgorithmMap = {
  Eagle3: 'eagle3',
  MTP: 'mtp',
  Ngram: 'ngram'
};

interface SpeculativeDecodeProps {
  /**
   * Renders the same fields at a nested Form path (e.g. `['roles', 1]`) so a
   * role can carry its own speculative config.
   *
   * Prefill and decode need *different* values, not one of them switched off:
   * for MTP-style speculation the draft head is part of the model, and the
   * NIXL handshake hashes the model — so a prefill that skips it fails the
   * compatibility check. Upstream runs prefill at 1 draft token and decode at
   * 3 or more. Absent means the model-level path, byte-for-byte what it was.
   */
  namePrefix?: (string | number)[];
  /**
   * Renders the fields inside a titled card with the enable control in its
   * title row, the shape the shared KV cache uses. Absent means the flat
   * checkbox-then-fields layout, byte-for-byte what it was.
   */
  section?: { label: string; description?: React.ReactNode };
}

/**
 * The enable switch for the card layout.
 *
 * A component rather than inline JSX because `Form.Item` injects `checked` and
 * `onChange` into its single child; inline, the injection would land on the
 * `Tooltip` and the switch would never see it. Same reason
 * `ExtendedKVCacheSwitch` exists next door.
 *
 * The disabled state carries its reason. A control greyed out with no
 * explanation is the failure this form keeps having to fix -- the answer
 * ("built-in backends only") is already written, it just has to be reachable
 * from the control that is refusing.
 */
const SpeculativeSwitch: React.FC<{
  checked?: boolean;
  disabled?: boolean;
  reason?: string;
  onChange?: (e: any) => void;
}> = ({ checked, disabled, reason, onChange }) => (
  <Tooltip title={disabled ? reason : false}>
    <span>
      <Switch
        size="small"
        checked={checked}
        disabled={disabled}
        // The handler reads `e.target.checked`, the checkbox shape it was
        // written for; a Switch hands over the boolean itself.
        onChange={(value: boolean) =>
          onChange?.({ target: { checked: value } })
        }
      ></Switch>
    </span>
  </Tooltip>
);

const SpeculativeDecode: React.FC<SpeculativeDecodeProps> = ({
  namePrefix,
  section
}) => {
  const intl = useIntl();
  const { source, flatBackendOptions, onValuesChange } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  // Every `speculative_config` path goes through this, so the section can
  // move under a role without any field knowing about roles.
  const path = (...field: (string | number)[]) =>
    namePrefix ? [...namePrefix, ...field] : field;
  // The engine is context, not this section's own field: a role that
  // overrides speculation without overriding its engine runs the model's.
  const roleBackend = Form.useWatch(path('backend'), form);
  const modelBackend = Form.useWatch('backend', form);
  const backend = namePrefix ? (roleBackend ?? modelBackend) : modelBackend;
  const speculativeEnabled = Form.useWatch(
    path('speculative_config', 'enabled'),
    form
  );
  const algorithm = Form.useWatch(
    path('speculative_config', 'algorithm'),
    form
  );
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
      form.setFieldValue(path('speculative_config'), {
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
      speculativeConfigRef.current = form.getFieldValue(
        path('speculative_config')
      );
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

  const unsupported = intl.formatMessage({ id: 'models.form.kvCache.tips2' });

  // In a card the enable control is a `Switch` in the title row, the shape the
  // shared KV cache block uses: a card title plus a labelled "Enable X" row is
  // the same fact twice with a control between them. Flat (the model level)
  // the labelled checkbox IS the heading, so it stays one.
  //
  // `Form.Item` injects `checked`/`onChange` into its single child, so the two
  // branches differ only in that child -- the field registration, the path and
  // the handler are identical, and neither branch can drift from the other.
  const toggle = section ? (
    <Form.Item<FormData>
      name={path('speculative_config', 'enabled')}
      valuePropName="checked"
      noStyle
    >
      <SpeculativeSwitch
        disabled={!builtInBackend}
        reason={unsupported}
        onChange={handleSpeculativeEnabledChange}
      />
    </Form.Item>
  ) : (
    <Form.Item<FormData>
      name={path('speculative_config', 'enabled')}
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
        description={unsupported}
        label={intl.formatMessage({
          id: 'models.form.enableSpeculativeDecoding'
        })}
        onChange={handleSpeculativeEnabledChange}
        disabled={!builtInBackend}
      ></CheckboxField>
    </Form.Item>
  );

  const fields = (
    <>
      {speculativeEnabled && (
        <>
          <Form.Item<FormData>
            name={path('speculative_config', 'algorithm')}
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
              name={path('speculative_config', 'draft_model')}
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
              <AutoComplete
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
              ></AutoComplete>
            </Form.Item>
          )}

          <Form.Item<FormData>
            name={path('speculative_config', 'num_draft_tokens')}
          >
            <CInputNumber
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
                name={path('speculative_config', 'ngram_min_match_length')}
              >
                <CInputNumber
                  label={intl.formatMessage({
                    id: 'models.form.ngramMinMatchLength'
                  })}
                  min={1}
                  step={1}
                />
              </Form.Item>
              <Form.Item<FormData>
                name={path('speculative_config', 'ngram_max_match_length')}
              >
                <CInput.Input
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

  if (section) {
    return (
      <RoleSection
        label={section.label}
        description={section.description}
        extra={toggle}
      >
        {fields}
      </RoleSection>
    );
  }

  return (
    <>
      {toggle}
      {fields}
    </>
  );
};

export default SpeculativeDecode;
