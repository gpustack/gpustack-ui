import useSetChunkRequest from '@/hooks/use-chunk-request';
import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { BaseSelect, LogsViewer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Flex, Modal, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    null
  );
  const [params, setParams] = useState<any>({
    follow: true
  });
  const [showPrevious, setShowPrevious] = useState(false);
  const logsViewerRef = React.useRef<any>(null);
  const { countOptions, fetchData, cancelRequest } =
    useQueryModelInstanceRestartCount();
  const requestRef = React.useRef<any>(null);
  const contentRef = React.useRef<any>(null);

  const currentWorkerCountList = useMemo(() => {
    return (
      countOptions?.find((option) => option.value === selectedContainer)
        ?.children || []
    );
  }, [countOptions, selectedContainer]);

  const filteredCountOptions = useMemo(() => {
    if (!showPrevious) return countOptions;
    return countOptions?.filter((option) =>
      option.children?.some((child) => child.previous)
    );
  }, [countOptions, showPrevious]);

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
    setSelectedContainer(null);
    setShowPrevious(false);
    cancelRequest();
  };

  const handleOnChange = (option: any) => {
    if (!option) {
      setParams({
        follow: true
      });
    } else {
      setParams({
        follow: true,
        watch: !option.previous,
        previous: option.previous,
        worker_id: option.worker_id,
        container: option.container
      });
    }
    setSelectedContainer(option?.parentValue || null);
  };

  const handleContainerChange = (value: string, option: any) => {
    setSelectedContainer(value);
    setShowPrevious(false);
    const counts = option?.children || [];
    const lastItem = counts.find((item: any) => !item.previous);
    if (lastItem) {
      handleOnChange(lastItem);
    }
  };

  const showCascader =
    countOptions?.some((option) => option.children?.length >= 2) ||
    countOptions?.length > 1;

  const handleOnChecked = (e: any) => {
    const checked = e.target.checked;
    setShowPrevious(checked);

    if (checked) {
      const currentPrev = currentWorkerCountList.find((item) => item.previous);
      if (currentPrev) {
        handleOnChange(currentPrev);
        return;
      }
      const mainOptionWithPrev = countOptions?.find(
        (option) =>
          option.isMain && option.children?.some((child) => child.previous)
      );
      const prevChild = mainOptionWithPrev?.children?.find(
        (child) => child.previous
      );
      if (prevChild) {
        handleOnChange(prevChild);
      }
      return;
    }

    const currentItem = currentWorkerCountList.find((item) => !item.previous);
    handleOnChange(currentItem);
  };

  const optionRender = (option: any) => {
    const optionData = option?.data || option;
    const [container, worker] = optionData.label.split(':');
    const startAt = optionData.start_at
      ? dayjs(optionData.start_at).format('YYYY-MM-DD HH:mm:ss')
      : '';

    return (
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={8}>
          <span>{container}</span>
          <span className="text-tertiary">[{worker}]</span>
        </Flex>
        {startAt && <span className="text-tertiary">{startAt}</span>}
      </Flex>
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginRight: 8
              }}
            >
              <Checkbox onChange={handleOnChecked} checked={showPrevious}>
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
                  <span style={{ fontWeight: 400 }}>
                    {intl.formatMessage({
                      id: 'models.instance.previousRun'
                    })}
                  </span>
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </Checkbox>
              <BaseSelect
                prefix={
                  <span
                    style={{
                      color: 'var(--ant-color-text-tertiary)',
                      fontWeight: 400,
                      borderRight: '1px solid var(--ant-color-split)',
                      paddingRight: 8,
                      marginRight: 8
                    }}
                  >
                    {intl.formatMessage({ id: 'resources.container' })}
                  </span>
                }
                options={filteredCountOptions}
                value={selectedContainer || undefined}
                labelRender={optionRender}
                optionRender={optionRender}
                onChange={handleContainerChange}
                style={{ width: 360 }}
              ></BaseSelect>
            </div>
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
        const lastItem = list.find((item) => item.isMain);
        if (lastItem) {
          handleOnChange(lastItem.children?.[0]);
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
        container: {
          padding: '12px 24px 24px 20px'
        },
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
          diffHeight={91}
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
