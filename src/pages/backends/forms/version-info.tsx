import AutoTooltip from '@/components/auto-tooltip';
import CopyButton from '@/components/copy-button';
import BaseSelect from '@/components/seal-form/base/select';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { useIntl } from '@umijs/max';
import { Empty, Typography } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import {
  BackendSourceLabelMap,
  BackendSourceValueMap,
  frameworks,
  getGpuColor,
  TagColorMap
} from '../config';
import { VersionListItem } from '../config/types';

const ItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  padding: 12px 16px;
  &:hover {
    background-color: var(--ant-color-fill-tertiary);
  }
  .title {
    width: 100%;
    justify-content: space-between;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  .label {
    color: var(--ant-color-text-tertiary);
  }
  .drivers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const InfoItem = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px;
  .label {
    color: var(--ant-color-text-tertiary);
  }
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
`;

const FilterBox = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 100;
  margin-block: 16px;
  background-color: var(--ant-color-bg-container);
`;

interface VersionItemProps {
  data: VersionListItem;
}

export const VersionItem: React.FC<VersionItemProps> = ({ data }) => {
  const intl = useIntl();

  const renderSource = () => {
    console.log('data.is_built_in', data.is_built_in);
    const source = data.is_built_in
      ? BackendSourceLabelMap[BackendSourceValueMap.BUILTIN] || ''
      : BackendSourceLabelMap[data.backend_source || ''] || '';
    if (!source) {
      return null;
    }
    return (
      <ThemeTag
        color={
          TagColorMap[
            data.is_built_in
              ? BackendSourceValueMap.BUILTIN
              : data.backend_source || ''
          ]
        }
        className="font-400"
        variant="outlined"
        style={{
          borderRadius: 'var(--ant-border-radius)',
          margin: 0,
          width: 'max-content'
        }}
      >
        {intl.formatMessage({
          id: source
        })}
      </ThemeTag>
    );
  };
  return (
    <ItemWrapper>
      <div className="title">
        <span>{data.version_no}</span>
        {renderSource()}
        {!data.is_built_in && data.is_default && (
          <ThemeTag
            color="geekblue"
            className="font-400"
            style={{ marginRight: 0 }}
          >
            {intl.formatMessage({ id: 'backend.isDefault' })}
          </ThemeTag>
        )}
      </div>
      <RowWrapper>
        {data.image_name && (
          <InfoItem>
            <span className="label">
              {intl.formatMessage({ id: 'backend.imageName' })}:
            </span>
            <CopyButton text={data.image_name} type="link">
              {data.is_built_in
                ? intl.formatMessage({ id: 'backend.versionInfo.autoImage' })
                : data.image_name}
            </CopyButton>
          </InfoItem>
        )}
        {data.entrypoint && (
          <InfoItem>
            <span className="label">
              {intl.formatMessage({ id: 'backend.replaceEntrypoint' })}:
            </span>
            <AutoTooltip ghost minWidth={20}>
              {data.entrypoint}
            </AutoTooltip>
          </InfoItem>
        )}
        {data.run_command && (
          <InfoItem>
            <span className="label">
              {intl.formatMessage({ id: 'backend.runCommand' })}:
            </span>
            <Typography.Text ellipsis={{ tooltip: data.run_command }}>
              {data.run_command}
            </Typography.Text>
          </InfoItem>
        )}
        <InfoItem>
          <span className="label">
            {intl.formatMessage({ id: 'backend.framework' })}:
          </span>
          <span className="text drivers">
            {data.availableFrameworks?.map((item) => {
              return (
                <ThemeTag
                  key={item}
                  style={{ marginRight: 0 }}
                  color={getGpuColor(item)}
                >
                  {item}
                </ThemeTag>
              );
            })}
          </span>
        </InfoItem>
      </RowWrapper>
    </ItemWrapper>
  );
};

const VersionList: React.FC<{ versionConfigs: VersionListItem[] }> = ({
  versionConfigs
}) => {
  const intl = useIntl();
  const [dataList, setDataList] = useState<VersionListItem[]>(versionConfigs);

  const handleChange = (value: string) => {
    if (value) {
      const filtered = versionConfigs.filter((item) =>
        item.availableFrameworks?.includes(value)
      );
      setDataList(filtered);
    } else {
      setDataList(versionConfigs);
    }
  };

  const optionRender = (option: any) => {
    const { data } = option;
    return (
      <span>
        {option.label}
        {data.tips ? (
          data.tipLocale ? (
            <span className="text-tertiary m-l-4">{` [${intl.formatMessage({ id: data.tips })}]`}</span>
          ) : (
            <span className="text-tertiary m-l-4">{` [${data.tips}]`}</span>
          )
        ) : null}
      </span>
    );
  };

  return (
    <div>
      <FilterBox>
        <BaseSelect
          allowClear
          placeholder={intl.formatMessage({ id: 'backend.filter.framework' })}
          options={frameworks}
          style={{ width: '100%' }}
          optionRender={optionRender}
          onChange={handleChange}
        />
      </FilterBox>
      <ListWrapper>
        {dataList.length ? (
          dataList.map((version: VersionListItem, index: number) => {
            return <VersionItem key={index} data={version} />;
          })
        ) : (
          <Empty
            style={{ width: '100%' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={intl.formatMessage({ id: 'backend.noVersion' })}
          />
        )}
      </ListWrapper>
    </div>
  );
};

export default VersionList;
