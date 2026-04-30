import {
  AutoTooltip,
  Input as CInput,
  Cascader as SealCascader
} from '@gpustack/core-ui';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import useQueryModelLoraList, {
  LoraOptionGroup
} from '../services/use-query-lora-list';

interface LoraListItemProps {
  item: { value: any[]; lora_name: string };
  base: string;
  defaultDataList: LoraOptionGroup[];
  selectedRepoNames: Set<string>;
  onChange: (partial: { value?: any[]; lora_name?: string }) => void;
}

const LoraListItem: React.FC<LoraListItemProps> = ({
  item,
  base,
  defaultDataList,
  selectedRepoNames,
  onChange
}) => {
  const { dataList: ownSearchList, fetchData } = useQueryModelLoraList();
  const [hasSearched, setHasSearched] = useState(false);

  const itemDataList = hasSearched ? ownSearchList : defaultDataList;

  const debouncedSearch = useMemo(
    () =>
      _.debounce((q: string) => {
        fetchData({ base, q });
      }, 300),
    [base]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    setHasSearched(false);
  }, [base]);

  const groupedOptions = useMemo(() => {
    const currentRepo = item.value?.[1];
    return itemDataList
      .map((group) => ({
        ...group,
        children: group.children.filter(
          (child) =>
            !selectedRepoNames.has(child.value) || child.value === currentRepo
        )
      }))
      .filter((group) => group.children.length > 0);
  }, [itemDataList, selectedRepoNames, item.value]);

  const handleSearch = (q: string) => {
    if (!base || !q) {
      setHasSearched(false);
      debouncedSearch.cancel();
      return;
    }
    setHasSearched(true);
    debouncedSearch(q);
  };

  const handleCascaderChange = (value: any) => {
    onChange({ value: value || [] });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ lora_name: e.target.value });
  };

  const cascaderEmpty = !item.value || item.value.length === 0;
  const nameEmpty = !item.lora_name;
  const cascaderStatus =
    cascaderEmpty && !nameEmpty ? ('error' as const) : undefined;
  const inputStatus =
    nameEmpty && !cascaderEmpty ? ('error' as const) : undefined;

  const displayRender = (labels: any[]) => {
    return (
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
    );
  };

  const optionNode = (option: any) => {
    const { data } = option;
    if (data.isParent) {
      return (
        <AutoTooltip ghost maxWidth={100}>
          {data.label}
        </AutoTooltip>
      );
    }
    return (
      <AutoTooltip ghost maxWidth={180}>
        {data.label}
      </AutoTooltip>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px',
        gap: 8,
        alignItems: 'center',
        flex: 1
      }}
    >
      <SealCascader
        showSearch
        expandTrigger="hover"
        multiple={false}
        alwaysFocus={true}
        status={cascaderStatus}
        value={item.value}
        options={groupedOptions}
        onChange={handleCascaderChange}
        onSearch={handleSearch}
        placeholder="Select LoRA"
        showCheckedStrategy="SHOW_CHILD"
        displayRender={displayRender}
        optionNode={optionNode}
        classNames={{
          popup: {
            root: 'cascader-popup-wrapper'
          }
        }}
        styles={{
          popup: {
            listItem: {
              padding: '5px 10px'
            }
          }
        }}
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
      ></SealCascader>
      <CInput.Input
        style={{ flex: 1 }}
        status={inputStatus}
        value={item.lora_name}
        onChange={handleNameChange}
        placeholder="LoRA name"
      />
    </div>
  );
};

export default LoraListItem;
