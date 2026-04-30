import { MetadataList } from '@gpustack/core-ui';
import { Form } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormData, LoraListItem } from '../config/types';
import useQueryModelLoraList from '../services/use-query-lora-list';
import LoraItem from './lora-list-item';

type ItemValue = { value: any[]; lora_name: string };

const ModelLoraList = () => {
  const form = Form.useFormInstance<FormData>();
  const huggingfaceRepoId = Form.useWatch('huggingface_repo_id', form);
  const modelScopeModelId = Form.useWatch('model_scope_model_id', form);
  const localPath = Form.useWatch('local_path', form);

  const base = huggingfaceRepoId || modelScopeModelId || localPath || '';

  const { dataList: defaultDataList, fetchData } = useQueryModelLoraList();

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
          lora_name: it.lora_name || ''
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

  const selectedRepoNames = useMemo(() => {
    return new Set(
      itemList.map((it) => it.value?.[1]).filter(Boolean) as string[]
    );
  }, [itemList]);

  const syncFormField = (newItemList: ItemValue[]) => {
    const newFormList = newItemList
      .map((it) => ({
        source: (it.value?.[0] || '') as 'huggingface' | 'model_scope',
        lora_repo_name: it.value?.[1] || '',
        lora_name: it.lora_name || ''
      }))
      .filter((it) => it.lora_repo_name?.trim() && it.lora_name?.trim());
    form.setFieldValue('lora_list', newFormList);
  };

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
    const newItemList = [...itemList, { value: [], lora_name: '' }];
    setItemList(newItemList);
    syncFormField(newItemList);
  };

  const handleDelete = (index: number) => {
    const newItemList = itemList.filter((_, i) => i !== index);
    setItemList(newItemList);
    syncFormField(newItemList);
  };

  return (
    <Form.Item<FormData> name="lora_list">
      <MetadataList
        label="LoRA Adapter"
        dataList={itemList}
        btnText="Add LoRA Adapter"
        onAdd={handleAdd}
        onDelete={handleDelete}
      >
        {(item, index) => (
          <LoraItem
            item={item}
            base={base}
            defaultDataList={defaultDataList}
            selectedRepoNames={selectedRepoNames}
            onChange={(partial) => handleItemChange(index, partial)}
          />
        )}
      </MetadataList>
    </Form.Item>
  );
};

export default ModelLoraList;
