import { MetadataList } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData, LoraListItem } from '../config/types';
import useQueryModelLoraList from '../services/use-query-lora-list';
import LoraItem from './lora-list-item';

type ItemValue = { value: any[]; lora_name: string; source: string };

const ModelLoraList = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const huggingfaceRepoId = Form.useWatch('huggingface_repo_id', form);
  const modelScopeModelId = Form.useWatch('model_scope_model_id', form);
  const localPath = Form.useWatch('local_path', form);

  const base = huggingfaceRepoId || modelScopeModelId || localPath || '';

  console.log('fetching lora list with base', base, form.getFieldsValue());

  const { dataList: defaultDataList, fetchData } = useQueryModelLoraList();
  const { submitAttempted } = useFormContext();
  const validated = !!submitAttempted;

  const [itemList, setItemList] = useState<ItemValue[]>([]);
  const initializedRef = useRef(false);
  const prevBaseRef = useRef<string>('');

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    const existing = (form.getFieldValue('lora_list') || []) as LoraListItem[];
    if (existing.length > 0) {
      setItemList(
        existing.map((it) => ({
          value:
            it.source && it.lora_repo_name
              ? [it.source, it.lora_repo_name]
              : [],
          lora_name: it.lora_name || '',
          source: it.source || ''
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (!base) {
      prevBaseRef.current = '';
      return;
    }

    fetchData({ base });
    if (prevBaseRef.current && prevBaseRef.current !== base) {
      form.setFieldValue('lora_list', []);
      setItemList([]);
    }
    prevBaseRef.current = base;
  }, [base]);

  useEffect(() => {
    if (!defaultDataList.length) return;
    const groupByRepo: Record<string, string> = {};
    defaultDataList.forEach((group) => {
      group.children.forEach((child) => {
        groupByRepo[child.value] = group.value;
      });
    });
    setItemList((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        const repo = it.value?.[1];
        if (!repo) return it;
        const groupValue = groupByRepo[repo];
        if (groupValue && groupValue !== it.value[0]) {
          changed = true;
          return { ...it, value: [groupValue, repo] };
        }
        return it;
      });
      return changed ? next : prev;
    });
  }, [defaultDataList]);

  const selectedRepoNames = useMemo(() => {
    return new Set(
      itemList.map((it) => it.value?.[1]).filter(Boolean) as string[]
    );
  }, [itemList]);

  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    itemList.forEach((it) => {
      const n = it.lora_name?.trim();
      if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
    });
    return new Set(
      Array.from(counts.entries())
        .filter(([, c]) => c > 1)
        .map(([n]) => n)
    );
  }, [itemList]);

  const syncFormField = (newItemList: ItemValue[]) => {
    const newFormList = newItemList
      .map((it) => ({
        source: (it.source || it.value?.[0] || '') as
          | 'huggingface'
          | 'model_scope',
        lora_repo_name: it.value?.[1] || '',
        lora_name: it.lora_name || ''
      }))
      .filter((it) => it.lora_repo_name?.trim() || it.lora_name?.trim());
    form.setFieldValue('lora_list', newFormList);
  };

  useEffect(() => {
    if (validated) {
      form.validateFields(['lora_list']).catch(() => {});
    }
  }, [itemList, validated]);

  const handleItemChange = (
    index: number,
    partial: { value?: any[]; lora_name?: string }
  ) => {
    const newItemList = [...itemList];
    newItemList[index] = { ...newItemList[index], ...partial };
    setItemList(newItemList);
    syncFormField(newItemList);
  };

  const handleAdd = () => {
    const newItemList = [...itemList, { value: [], lora_name: '', source: '' }];
    setItemList(newItemList);
    syncFormField(newItemList);
  };

  const handleDelete = (index: number) => {
    const newItemList = itemList.filter((_, i) => i !== index);
    setItemList(newItemList);
    syncFormField(newItemList);
  };

  return (
    <Form.Item<FormData>
      name="lora_list"
      rules={[
        {
          validator: async (_, value: LoraListItem[]) => {
            if (!value || value.length === 0) return;

            for (const it of value) {
              const hasRepo = !!it.lora_repo_name?.trim();
              const hasName = !!it.lora_name?.trim();
              if (hasRepo !== hasName) {
                throw new Error(
                  intl.formatMessage({ id: 'models.form.lora.rule.empty' })
                );
              }
            }

            const names = value
              .map((it) => it.lora_name?.trim())
              .filter(Boolean) as string[];
            if (names.length !== new Set(names).size) {
              throw new Error(
                intl.formatMessage({ id: 'models.form.lora.rule.duplicate' })
              );
            }
          }
        }
      ]}
    >
      <MetadataList
        label={intl.formatMessage({ id: 'models.form.lora.label' })}
        dataList={itemList}
        btnText={intl.formatMessage({ id: 'models.form.lora.add' })}
        onAdd={handleAdd}
        onDelete={handleDelete}
      >
        {(item, index) => (
          <LoraItem
            item={item}
            base={base}
            defaultDataList={defaultDataList}
            selectedRepoNames={selectedRepoNames}
            duplicateNames={duplicateNames}
            validated={validated}
            onChange={(partial) => handleItemChange(index, partial)}
          />
        )}
      </MetadataList>
    </Form.Item>
  );
};

export default ModelLoraList;
