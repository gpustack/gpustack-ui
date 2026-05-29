import { LoadingOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  Input as CInput,
  Select as SealSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { modelSourceMap } from '../config';
import useQueryModelLoraList, {
  LoraOptionGroup
} from '../services/use-query-lora-list';
import loraSelectionStyles from '../style/lora-selection.less';

interface LoraListItemProps {
  item: { value: any[]; lora_name: string; source: string };
  base: string;
  defaultDataList: LoraOptionGroup[];
  selectedRepoNames: Set<string>;
  duplicateNames: Set<string>;
  validated: boolean;
  onChange: (partial: {
    value?: any[];
    lora_name?: string;
    source?: string;
  }) => void;
}

type RenderableGroup = {
  label: string;
  groupValue: string;
  options: { label: string; value: string; source: string }[];
};

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
  const {
    dataList: ownSearchList,
    fetchData,
    loading
  } = useQueryModelLoraList();
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

  const groupedOptions = useMemo<RenderableGroup[]>(() => {
    const currentRepo = item.value?.[1];
    const sourcePrefix = intl.formatMessage({ id: 'models.form.source' });
    const groups: RenderableGroup[] = [];
    let hasLocal = false;

    itemDataList.forEach((group) => {
      const isLocal = group.value === modelSourceMap.local_path_value;
      if (isLocal) hasLocal = true;
      const filtered = group.children.filter(
        (child) =>
          !selectedRepoNames.has(child.value) || child.value === currentRepo
      );
      const labelText = isLocal
        ? intl.formatMessage({ id: 'menu.models.modelfiles' })
        : group.label;
      groups.push({
        label: `${sourcePrefix}: ${labelText}`,
        groupValue: group.value,
        options: filtered.map((c) => ({
          label: c.label,
          value: c.value,
          source: c.source,
          data: { source: c.source, groupValue: group.value }
        }))
      });
    });

    if (!hasLocal) {
      groups.push({
        label: `${sourcePrefix}: ${intl.formatMessage({ id: 'menu.models.modelfiles' })}`,
        groupValue: modelSourceMap.local_path_value,
        options: []
      });
    }

    return groups;
  }, [itemDataList, selectedRepoNames, item.value, intl]);

  const handleSearch = (q: string) => {
    if (!base || !q) {
      setHasSearched(false);
      debouncedSearch.cancel();
      return;
    }
    setHasSearched(true);
    debouncedSearch(q);
  };

  const handleSelectChange = (value: string, option: any) => {
    if (!value) {
      onChange({ value: [], source: '' });
      return;
    }
    const data = option?.data || {};
    const groupValue = data.groupValue || modelSourceMap.local_path_value;
    const source = data.source || modelSourceMap.local_path_value;
    onChange({ value: [groupValue, value], source });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ lora_name: e.target.value });
  };

  const optionRender = (option: any) => {
    return <AutoTooltip ghost>{option.label}</AutoTooltip>;
  };

  const labelRender = (option: any) => {
    return option.label;
  };

  const valueEmpty = !item.value?.[1];
  const nameEmpty = !item.lora_name?.trim();
  const isDuplicate =
    !!item.lora_name?.trim() && duplicateNames.has(item.lora_name.trim());

  const selectStatus = validated && valueEmpty ? ('error' as const) : 'success';

  const inputStatus =
    validated && (nameEmpty || isDuplicate) ? ('error' as const) : 'success';

  return (
    <div className={loraSelectionStyles.wrapper}>
      <div style={{ minWidth: 0 }}>
        <SealSelect
          allowClear={!loading}
          showSearch
          filterOption={false}
          status={selectStatus}
          loading={loading}
          suffixIcon={
            loading ? (
              <Button size="small" type="link">
                <LoadingOutlined />
              </Button>
            ) : null
          }
          value={item.value?.[1] || undefined}
          onChange={handleSelectChange}
          onSearch={handleSearch}
          labelRender={labelRender}
          optionRender={optionRender}
          placeholder={intl.formatMessage({ id: 'models.form.lora.select' })}
          options={groupedOptions}
        ></SealSelect>
      </div>
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
