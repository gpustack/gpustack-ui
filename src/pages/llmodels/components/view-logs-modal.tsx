import useSetChunkRequest from '@/hooks/use-chunk-request';
import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { LogsViewer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Modal, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import { MODELS_API } from '../apis';

import SealCascader from '@/components/seal-form/seal-cascader';
import { InstanceRealtimeLogStatus, InstanceStatusMap } from '../config';
import useQueryModelInstanceRestartCount from '../services/use-query-instance-restart-count';

type ViewModalProps = {
  open: boolean;
  url: string;
  id?: number;
  modelId?: number | string;
  tail?: number;
  status?: string;
  onCancel: () => void;
};

const ViewLogsModal: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();
  const { setChunkRequest } = useSetChunkRequest();
  const { open, url, onCancel, tail, status } = props || {};
  const [enableScorllLoad, setEnableScorllLoad] = useState(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(
    status === InstanceStatusMap.Downloading
  );
  const [record, setRecord] = useState<number[]>([]);
  const [params, setParams] = useState<any>({
    follow: true
  });
  const logsViewerRef = React.useRef<any>(null);
  const { countOptions, fetchData, cancelRequest } =
    useQueryModelInstanceRestartCount();
  const requestRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const handleCancel = useCallback(() => {
    logsViewerRef.current?.abort();
    onCancel();
  }, [onCancel]);

  const updateHandler = (list: any) => {
    const data = list?.find((item: any) => item.data?.id === props.id);
    // state in InstanceRealtimeLogStatus will not enable scorll load, because it is in the trasisition state

    if (data) {
      setIsDownloading(data?.data?.state === InstanceStatusMap.Downloading);
      setEnableScorllLoad(
        () => !InstanceRealtimeLogStatus.includes(data?.data?.state)
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (contentRef.current) {
          const range = document.createRange();
          range.selectNodeContents(contentRef.current);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const cancelOnClose = () => {
    logsViewerRef.current?.abort();
    requestRef.current?.current?.cancel?.();
    cancelRequest();
  };

  const handleOnChange = (value: number[], option: any) => {
    if (!option) {
      setParams({
        follow: true
      });
    } else {
      setParams({
        follow: true,
        watch: false,
        restart_count: option.value,
        worker_id: option.worker_id
      });
    }
    setRecord(value);
  };

  const renderLabel = (label: string, time: string) => {
    return (
      <span className="flex-between gap-8">
        <span>{label}</span>
        <span className="text-tertiary font-400">
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      </span>
    );
  };

  const optionRender = (option: any) => {
    const { data = {} } = option || {};
    if (data.isParent) {
      return <span style={{ fontWeight: 400 }}>{data.label}</span>;
    }
    return renderLabel(data.label, data.start_at);
  };

  const handleOnCountChange = (value: any[], selectedOptions: any[]) => {
    const option = selectedOptions?.[1];
    handleOnChange(value, option);
  };

  const showCascader =
    countOptions?.some((option) => option.children!?.length >= 2) ||
    countOptions?.length > 1;

  const renderPrefix = () => {
    return (
      <span
        style={{
          fontWeight: 400,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          marginRight: 8,
          paddingRight: 8,
          color: 'var(--ant-color-text-secondary)',
          borderRight: '1px solid var(--ant-color-split)'
        }}
      >
        {intl.formatMessage({ id: 'models.instance.startHistory' })}
        <Tooltip
          title={
            <span>
              <span className="font-600 m-r-8">
                {intl.formatMessage({
                  id: 'models.instance.previousRun'
                })}
                :
              </span>
              {intl.formatMessage({
                id: 'models.instance.startHistory.tips'
              })}
            </span>
          }
        >
          <QuestionCircleOutlined style={{ marginLeft: 4 }} />
        </Tooltip>
      </span>
    );
  };

  const renderTitle = () => {
    return (
      <span className="flex-between flex-center gap-16" style={{ height: 40 }}>
        <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
          {intl.formatMessage({ id: 'common.button.viewlog' })}
        </span>
        <span className="flex-center gap-8" style={{ height: 32 }}>
          {showCascader && (
            <SealCascader
              size="small"
              prefix={renderPrefix()}
              required
              showSearch
              changeOnSelect={false}
              expandTrigger="hover"
              style={{ width: 400 }}
              multiple={false}
              classNames={{
                popup: {
                  root: 'cascader-popup-wrapper gpu-selector'
                }
              }}
              maxTagCount={1}
              value={record}
              options={countOptions}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              optionNode={optionRender}
              onChange={handleOnCountChange}
            ></SealCascader>
          )}
          <Button
            type="text"
            color="default"
            icon={<CloseOutlined />}
            onClick={handleCancel}
            size="middle"
          ></Button>
        </span>
      </span>
    );
  };

  useEffect(() => {
    if (open && props.id) {
      requestRef.current?.current?.cancel?.();
      requestRef.current = setChunkRequest({
        url: `${MODELS_API}/${props.modelId}/instances`,
        handler: updateHandler
      });
      fetchData(props.id).then((list) => {
        const lastItem = list?.[0];
        if (lastItem) {
          handleOnChange(
            [lastItem.value, lastItem.children?.[0]?.value],
            lastItem.children?.[0]
          );
        }
      });
    } else {
      cancelOnClose();
    }

    return () => {
      cancelOnClose();
    };
  }, [props.id, open]);

  return (
    <Modal
      title={renderTitle()}
      open={open}
      centered={true}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={true}
      styles={{
        wrapper: {
          borderRadius: 0
        }
      }}
      width="100%"
      footer={null}
    >
      <div className="viewer-wrapper" ref={contentRef}>
        <LogsViewer
          ref={logsViewerRef}
          diffHeight={95}
          url={url}
          tail={tail}
          enableScorllLoad={enableScorllLoad}
          isDownloading={isDownloading}
          params={params}
        ></LogsViewer>
      </div>
    </Modal>
  );
};

export default ViewLogsModal;
