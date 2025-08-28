import IconFont from '@/components/icon-font';
import { KeyMap } from '@/config/hotkeys';
import UploadImg from '@/pages/playground/components/upload-img';
import {
  ClearOutlined,
  DownloadOutlined,
  ExpandOutlined,
  FormatPainterOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Slider, Tooltip } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import React from 'react';

interface ToolsBarProps {
  disabled: boolean;
  loading: boolean;
  lineWidth: number;
  uploadButton?: React.ReactNode;
  invertMask?: boolean;
  accept?: string;
  handleBrushSizeChange: (value: number) => void;
  undo: () => void;
  onClear: () => void;
  handleFitView: () => void;
  handleUpdateImageList: (fileList: any[]) => void;
  handleUpdateMaskList: (fileList: any[]) => void;
}

const ToolsBar: React.FC<ToolsBarProps> = (props) => {
  const {
    disabled,
    loading,
    lineWidth,
    invertMask,
    accept,
    handleBrushSizeChange,
    undo,
    onClear,
    handleFitView,
    handleUpdateImageList,
    handleUpdateMaskList
  } = props;
  const intl = useIntl();
  return (
    <div className="tools">
      <Tooltip
        placement="bottomLeft"
        arrow={false}
        styles={{
          body: {
            background: 'var(--color-white-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: 160
          }
        }}
        title={
          <div className="flex-column" style={{ width: '100%' }}>
            <span className="text-secondary">
              {intl.formatMessage({ id: 'playground.image.brushSize' })}
            </span>
            <Slider
              disabled={disabled}
              style={{ marginBlock: '4px 6px', marginLeft: 0, flex: 1 }}
              vertical={false}
              defaultValue={lineWidth}
              min={10}
              max={100}
              onChange={handleBrushSizeChange}
            />
          </div>
        }
      >
        <Button size="middle" type="text">
          <FormatPainterOutlined className="font-size-14" />
        </Button>
      </Tooltip>
      <Tooltip
        title={
          <span>
            [{KeyMap.UNDO.textKeybinding}]
            <span className="m-l-5">
              {intl.formatMessage({ id: 'common.button.undo' })}
            </span>
          </span>
        }
      >
        <Button onClick={undo} size="middle" type="text" disabled={disabled}>
          <UndoOutlined className="font-size-14" />
        </Button>
      </Tooltip>
      <Tooltip title={intl.formatMessage({ id: 'common.button.clear' })}>
        <Button onClick={onClear} size="middle" type="text" disabled={disabled}>
          <ClearOutlined className="font-size-14" />
        </Button>
      </Tooltip>
      <UploadImg
        disabled={loading || invertMask}
        handleUpdateImgList={handleUpdateImageList}
        size="middle"
        accept={accept}
      ></UploadImg>
      <UploadImg
        title={intl.formatMessage({
          id: 'playground.image.mask.upload'
        })}
        icon={<IconFont type="icon-mosaic-2"></IconFont>}
        disabled={loading || invertMask}
        handleUpdateImgList={handleUpdateMaskList}
        size="middle"
        accept={accept}
      ></UploadImg>
      <Tooltip title={intl.formatMessage({ id: 'playground.image.fitview' })}>
        <Button
          onClick={handleFitView}
          size="middle"
          type="text"
          disabled={loading}
        >
          <ExpandOutlined className="font-size-14" />
        </Button>
      </Tooltip>
    </div>
  );
};

interface ImageActionsBarProps {
  disabled: boolean;
  maskUpload?: any[];
  isOriginal: boolean;
  invertMask: boolean;
  handleOnChangeMask: (e: CheckboxChangeEvent) => void;
  downloadMask: () => void;
  download: () => void;
}

const ImageActionsBar: React.FC<ImageActionsBarProps> = (props) => {
  const intl = useIntl();
  const {
    disabled,
    isOriginal,
    invertMask,
    handleOnChangeMask,
    downloadMask,
    download
  } = props;
  return (
    <div className="tools">
      {isOriginal && (
        <>
          <Tooltip
            title={
              <span style={{ whiteSpace: 'pre-wrap' }}>
                {intl.formatMessage({
                  id: 'playground.image.negativeMask.tips'
                })}
              </span>
            }
          >
            <Checkbox
              onChange={handleOnChangeMask}
              className="flex-center"
              checked={invertMask}
              disabled={disabled}
            >
              <span className="font-size-12">
                {intl.formatMessage({
                  id: 'playground.image.negativeMask'
                })}
              </span>
            </Checkbox>
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({
              id: 'playground.image.saveMask'
            })}
          >
            <Button onClick={downloadMask} size="middle" type="text">
              <IconFont className="font-size-14" type="icon-save1"></IconFont>
            </Button>
          </Tooltip>
        </>
      )}
      {!isOriginal && (
        <Tooltip
          title={intl.formatMessage({ id: 'playground.image.download' })}
        >
          <Button onClick={download} size="middle" type="text">
            <DownloadOutlined className="font-size-14" />
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export { ImageActionsBar, ToolsBar };
