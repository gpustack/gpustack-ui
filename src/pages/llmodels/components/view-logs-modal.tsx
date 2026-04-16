import LogsViewer from '@/components/logs-viewer/virtual-log-list';
import BaseSelect from '@/components/seal-form/base/select';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Modal } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { MODELS_API } from '../apis';

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

  const handleOnChange = (value: number, option: any) => {
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
  };

  const renderTitle = () => {
    return (
      <span className="flex-between flex-center gap-16">
        <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
          {intl.formatMessage({ id: 'common.button.viewlog' })}
        </span>
        <span>
          <BaseSelect
            allowClear
            onChange={handleOnChange}
            prefix={
              <span
                style={{
                  fontWeight: 400,
                  fontSize: 13,
                  marginRight: 8,
                  paddingRight: 8,
                  color: 'var(--ant-color-text-secondary)',
                  borderRight: '1px solid var(--ant-color-split)'
                }}
              >
                {intl.formatMessage({ id: 'models.instance.startHistory' })} (
                {countOptions.length})
              </span>
            }
            options={countOptions}
            labelRender={(option) => {
              return (
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13
                  }}
                >
                  {option?.label}
                </span>
              );
            }}
            style={{
              width: 400,
              marginRight: 16
            }}
          ></BaseSelect>
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
      fetchData(props.id);
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
