import AutoTooltip from '@/components/auto-tooltip';
import DropdownButtons from '@/components/drop-down-buttons';
import { TooltipOverlayScroller } from '@/components/overlay-scroller';
import StatusTag from '@/components/status-tag';
import { tableSorter } from '@/config/settings';
import { modelSourceMap } from '@/pages/llmodels/config';
import { modelFileActions } from '@/pages/llmodels/config/button-actions';
import { convertFileSize } from '@/utils';
import {
  CheckCircleFilled,
  CopyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useMemo } from 'react';
import styled from 'styled-components';
import {
  ModelfileState,
  ModelfileStateMap,
  ModelfileStateMapValue
} from '../config';
import { ModelFile as ListItem } from '../config/types';
const { Paragraph } = Typography;

const TextWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: default;
  height: 100%;
  min-width: 32px;
`;

const PathWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  &::after {
    content: '';
    display: block;
    width: 20px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
  .btn-wrapper {
    display: flex;
    opacity: 0;
    width: 0;
    align-items: center;
  }
  &:hover {
    .btn-wrapper {
      width: auto;
      opacity: 1;
    }
  }
`;

const FilesTag = styled(Tag)`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-inline: 4px 0;
  height: 22px;
  border-radius: var(--border-radius-base);
`;

const TypographyPara = styled(Paragraph)`
  background: transparent;
  color: inherit;
  margin-bottom: 0;
  font-size: 13px;
`;

const ItemWrapper = styled.ul`
  max-width: 300px;
  margin: 0;
  padding-inline: 13px 0;
  word-break: break-word;
  li {
    line-height: 1.6;
  }
`;

const getResolvedPath = (pathList: string[]) => {
  return _.split(pathList?.[0], /[\\/]/).pop();
};

const setActionList = (record: ListItem) => {
  return _.filter(modelFileActions, (item: { key: string }) => {
    if (item.key === 'deploy') {
      return record.state === ModelfileStateMap.Ready;
    }
    return true;
  });
};

const TooltipTitle: React.FC<{ path: string }> = ({ path }) => {
  const intl = useIntl();
  return (
    <TypographyPara
      style={{ margin: 0 }}
      copyable={{
        icon: [
          <CopyOutlined key="copy-icon" />,
          <CheckCircleFilled key="copied-icon" />
        ],
        text: path,
        tooltips: [
          intl.formatMessage({ id: 'common.button.copy' }),
          intl.formatMessage({ id: 'common.button.copied' })
        ]
      }}
    >
      {path}
    </TypographyPara>
  );
};

const InstanceStatusTag = (props: { data: ListItem }) => {
  const { data } = props;
  if (!data.state) {
    return null;
  }
  return (
    <StatusTag
      download={
        data.state === ModelfileStateMap.Downloading
          ? { percent: data.download_progress }
          : undefined
      }
      statusValue={{
        status:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ModelfileState[ModelfileStateMap.Ready]
            : ModelfileState[data.state],
        text: ModelfileStateMapValue[data.state],
        message:
          data.state === ModelfileStateMap.Downloading &&
          data.download_progress === 100
            ? ''
            : data.state_message
      }}
    />
  );
};

const getModelInfo = (record: ListItem) => {
  const source = _.get(modelSourceMap, record.source, '');
  if (record.source === modelSourceMap.huggingface_value) {
    return {
      source: `${source}/${record.huggingface_repo_id}`,
      repo_id: record.huggingface_repo_id,
      title: `${record.huggingface_repo_id}/${record.huggingface_filename}`,
      filename: record.huggingface_filename || record.huggingface_repo_id
    };
  }

  if (record.source === modelSourceMap.modelscope_value) {
    return {
      source: `${source}/${record.model_scope_model_id}`,
      repo_id: record.model_scope_model_id,
      title: `${record.model_scope_model_id}/${record.model_scope_file_path}`,
      filename: record.model_scope_file_path || record.model_scope_model_id
    };
  }

  return {
    source: `${source}${record.local_path}`,
    repo_id: record.local_path,
    title: record.local_path,
    filename: _.split(record.local_path, /[\\/]/).pop()
  };
};

const RenderParts = (props: { record: ListItem }) => {
  const { record } = props;
  const intl = useIntl();
  const parts = record.resolved_paths || [];
  if (parts.length <= 1) {
    return null;
  }

  const renderItem = () => {
    return (
      <ItemWrapper>
        {parts.map((item: string, index: number) => {
          return <li key={index}>{_.split(item, /[\\/]/).pop()}</li>;
        })}
      </ItemWrapper>
    );
  };

  return (
    <TooltipOverlayScroller title={renderItem()}>
      <FilesTag color="purple" icon={<InfoCircleOutlined />}>
        <span style={{ opacity: 1 }}>
          {record.resolved_paths?.length}{' '}
          {intl.formatMessage({ id: 'models.form.files' })}
        </span>
      </FilesTag>
    </TooltipOverlayScroller>
  );
};

const ResolvedPathColumn = (props: { record: ListItem }) => {
  const { record } = props;
  const intl = useIntl();
  if (
    !record.resolved_paths.length &&
    record.state === ModelfileStateMap.Downloading
  ) {
    return (
      <span>
        {intl.formatMessage({
          id: 'resources.modelfiles.storagePath.holder'
        })}
      </span>
    );
  }
  return (
    record.resolved_paths?.length > 0 && (
      <PathWrapper>
        <TextWrapper>
          <AutoTooltip
            ghost
            showTitle
            title={
              <TooltipTitle path={record.resolved_paths?.[0]}></TooltipTitle>
            }
          >
            <span>{getResolvedPath(record.resolved_paths)}</span>
          </AutoTooltip>
        </TextWrapper>
        <RenderParts record={record}></RenderParts>
      </PathWrapper>
    )
  );
};

const getWorkerName = (
  id: number,
  workersList: Global.BaseOption<number>[]
) => {
  const worker = workersList.find((item) => item.value === id);
  return worker?.label || '';
};

const useFilesColumns = (props: {
  handleSelect: (action: string, record: ListItem) => void;
  workersList: Global.BaseOption<number>[];
  sortOrder: string[];
}): ColumnsType<ListItem> => {
  const { workersList, sortOrder, handleSelect } = props;
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        sorter: tableSorter(1),
        minWidth: 32,
        render: (text: string, record: ListItem) => {
          const modelInfo = getModelInfo(record);
          const { source } = modelInfo;
          return (
            <TextWrapper style={{ paddingRight: 8 }}>
              <AutoTooltip ghost title={source}>
                {source}
              </AutoTooltip>
            </TextWrapper>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'resources.worker' }),
        dataIndex: 'worker_id',
        sorter: tableSorter(2),
        minWidth: 32,
        render: (text: string, record: ListItem) => {
          return (
            <AutoTooltip ghost>
              <span>{getWorkerName(record.worker_id, workersList)}</span>
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'state',
        width: 160,
        render: (text: string, record: ListItem) => {
          return <InstanceStatusTag data={record} />;
        }
      },
      {
        title: intl.formatMessage({ id: 'resources.modelfiles.form.path' }),
        dataIndex: 'resolved_paths',
        sorter: tableSorter(3),
        width: '20%',
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => (
          <ResolvedPathColumn record={record} />
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.modelfiles.size' }),
        dataIndex: 'size',
        width: 110,
        align: 'right',
        ellipsis: {
          showTitle: false
        },
        render: (text: string, record: ListItem) => {
          return (
            <AutoTooltip ghost>
              <span>{convertFileSize(record.size, 1, true)}</span>
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(4),
        width: 180,
        ellipsis: {
          showTitle: false
        },
        render: (text: number) => (
          <AutoTooltip ghost minWidth={20}>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operation',
        width: 120,
        render: (text: string, record: ListItem) => (
          <DropdownButtons
            items={setActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          ></DropdownButtons>
        )
      }
    ];
  }, [intl, workersList, handleSelect]);
};

export default useFilesColumns;
