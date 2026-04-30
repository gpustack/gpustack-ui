import {
  AutoTooltip,
  Input as CInput,
  Cascader as SealCascader
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import useQueryModelLoraList, {
  LoraOptionGroup
} from '../services/use-query-lora-list';
import loraSelectionStyles from '../style/lora-selection.less';

interface LoraListItemProps {
  item: { value: any[]; lora_name: string };
  base: string;
  defaultDataList: LoraOptionGroup[];
  selectedRepoNames: Set<string>;
  duplicateNames: Set<string>;
  validated: boolean;
  onChange: (partial: { value?: any[]; lora_name?: string }) => void;
}

const LoraListItem: React.FC<LoraListItemProps> = ({
  item,
  base,
  defaultDataList,
  selectedRepoNames,
  duplicateNames,
  validated,
  onChange
}) => {
  const intl = useIntl();
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
  const nameEmpty = !item.lora_name?.trim();
  const isDuplicate =
    !!item.lora_name?.trim() && duplicateNames.has(item.lora_name.trim());

  const cascaderStatus =
    validated && cascaderEmpty ? ('error' as const) : 'success';

  const inputStatus =
    validated && (nameEmpty || isDuplicate) ? ('error' as const) : 'success';

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
    return (
      <AutoTooltip ghost maxWidth={'100%'}>
        {data.label}
      </AutoTooltip>
    );
  };

  return (
    <div className={loraSelectionStyles.item}>
      <SealCascader
        expandTrigger="click"
        multiple={false}
        alwaysFocus={true}
        status={cascaderStatus}
        value={item.value}
        options={groupedOptions}
        onChange={handleCascaderChange}
        showSearch={{
          onSearch: handleSearch
        }}
        placeholder={intl.formatMessage({ id: 'models.form.lora.select' })}
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
        status={inputStatus}
        value={item.lora_name}
        onChange={handleNameChange}
        placeholder={intl.formatMessage({ id: 'models.form.lora.name' })}
      />
    </div>
  );
};

export default LoraListItem;
