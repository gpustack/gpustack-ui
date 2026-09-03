import { PageAction } from '@/config';
import {
  InputNumber as CInputNumber,
  MetadataList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import React, { useState } from 'react';
import SectionCard from '../components/section-card';
import { useFormContext } from '../config/form-context';

// Shared prefix is opt-in: the bucket list only appears once enabled (or, in
// EDIT, when buckets already exist).
//
// The list is controlled the same way Add Cluster's Image Credentials are
// (MetadataList + a form array): add / delete / per-field edits all rewrite
// prefix_buckets on the form. `prefixValidated` flips on the first failed submit
// so empty required fields highlight (no submitAttempted here).
const SharedPrefixCard: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const disabled = action === PageAction.EDIT;

  // `preserve: true` is REQUIRED, not a tweak: it makes useWatch read
  // getFieldsValue(true) — the raw store — instead of getFieldsValue(), which
  // only carries REGISTERED fields. The Form.Item below lives in SectionCard's
  // open-gated children, so a plain watch would read undefined while the card is
  // closed, `showPrefix` would stay false, and the card could never open from
  // prefilled data. Circular, and the toggle handler would then overwrite the
  // prefill (`!prefixBuckets?.length` is true for undefined).
  const prefixBuckets = Form.useWatch('prefix_buckets', {
    form,
    preserve: true
  });
  // null = the user has not touched the switch, so derive from the store.
  // Deriving from `currentData` instead would resurrect the card on every remount
  // (switching the dataset away from Random and back unmounts it), since that
  // prefill snapshot never learns the user turned the feature off.
  const [prefixToggle, setPrefixToggle] = useState<boolean | null>(null);
  const showPrefix =
    prefixToggle ?? (Array.isArray(prefixBuckets) && prefixBuckets.length > 0);
  const handlePrefixToggle = (checked: boolean) => {
    setPrefixToggle(checked);
    if (!checked) {
      form.setFieldValue('prefix_buckets', []);
    } else if (!prefixBuckets?.length) {
      form.setFieldValue('prefix_buckets', [
        { prefix_count: 1, bucket_weight: 100 }
      ]);
    }
  };

  const [prefixValidated, setPrefixValidated] = useState(false);
  const revalidatePrefix = () => {
    if (prefixValidated)
      form.validateFields(['prefix_buckets']).catch(() => {});
  };
  const handlePrefixAdd = () => {
    form.setFieldValue('prefix_buckets', [
      ...(prefixBuckets || []),
      { prefix_count: 1, bucket_weight: 100 }
    ]);
  };
  const handlePrefixDelete = (index: number) => {
    const next = [...(prefixBuckets || [])];
    next.splice(index, 1);
    form.setFieldValue('prefix_buckets', next);
    revalidatePrefix();
  };
  const handlePrefixItemChange = (
    index: number,
    partial: Record<string, any>
  ) => {
    const next = [...(prefixBuckets || [])];
    next[index] = { ...next[index], ...partial };
    form.setFieldValue('prefix_buckets', next);
    revalidatePrefix();
  };

  return (
    <SectionCard
      title={intl.formatMessage({ id: 'benchmark.form.sharedPrefix' })}
      tip={intl.formatMessage({ id: 'benchmark.form.prefix.tip' })}
      open={showPrefix}
      onOpenChange={handlePrefixToggle}
      disabled={disabled}
    >
      <Form.Item
        name="prefix_buckets"
        style={{ marginBottom: 0 }}
        rules={[
          {
            validator: async (_r, value: any[]) => {
              if (!value?.length) return;
              if (value.some((b) => b?.prefix_tokens == null)) {
                setPrefixValidated(true);
                throw new Error(
                  getRuleMessage('input', 'benchmark.form.prefix.length')
                );
              }
            }
          }
        ]}
      >
        {/* Same list UX as Add Cluster's Image Credentials: a MetadataList
              (bordered card stripped here since the section is already a card)
              with a block "Add" button and a circular per-row delete button. */}
        <MetadataList
          label={null}
          dataList={prefixBuckets || []}
          disabled={disabled}
          btnText={intl.formatMessage({ id: 'benchmark.form.prefix.add' })}
          onAdd={handlePrefixAdd}
          onDelete={handlePrefixDelete}
          styles={{
            wrapper: {
              border: 'none',
              borderRadius: 0,
              padding: 0
            }
          }}
        >
          {(item: any, index: number) => (
            <div style={{ flex: 1, minWidth: 0 }}>
              {index !== 0 && <div style={{ height: 12 }} />}
              <Flex gap={12}>
                <CInputNumber
                  required
                  min={1}
                  disabled={disabled}
                  value={item.prefix_tokens}
                  onChange={(v) =>
                    handlePrefixItemChange(index, { prefix_tokens: v })
                  }
                  checkStatus={
                    prefixValidated && item.prefix_tokens == null
                      ? 'error'
                      : 'success'
                  }
                  label={intl.formatMessage({
                    id: 'benchmark.form.prefix.length'
                  })}
                  style={{ width: '100%' }}
                ></CInputNumber>
                <CInputNumber
                  min={1}
                  disabled={disabled}
                  value={item.prefix_count}
                  onChange={(v) =>
                    handlePrefixItemChange(index, { prefix_count: v })
                  }
                  label={intl.formatMessage({
                    id: 'benchmark.form.prefix.count'
                  })}
                  style={{ width: '100%' }}
                ></CInputNumber>
                <CInputNumber
                  min={1}
                  disabled={disabled}
                  value={item.bucket_weight}
                  onChange={(v) =>
                    handlePrefixItemChange(index, { bucket_weight: v })
                  }
                  label={intl.formatMessage({
                    id: 'benchmark.form.prefix.weight'
                  })}
                  style={{ width: '100%' }}
                ></CInputNumber>
              </Flex>
            </div>
          )}
        </MetadataList>
      </Form.Item>
    </SectionCard>
  );
};

export default SharedPrefixCard;
