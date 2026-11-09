import { PictureOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { RcFile } from 'antd/es/upload';
import { debounce, round } from 'lodash';
import React, { useCallback, useRef } from 'react';

const acceptImageType = ['image/png', 'image/jpg', 'image/jpeg'];

interface UploadImgProps {
  size?: 'small' | 'middle' | 'large';
  height?: number;
  multiple?: boolean;
  drag?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  accept?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  handleUpdateImgList: (
    imgList: {
      dataUrl: string;
      uid: number | string;
      rawWidth: number;
      rawHeight: number;
    }[]
  ) => void;
}

const UploadImg: React.FC<UploadImgProps> = ({
  handleUpdateImgList,
  multiple = true,
  drag = false,
  disabled = false,
  children,
  icon,
  title,
  accept = acceptImageType.join(','),
  size = 'small'
}) => {
  const intl = useIntl();
  const uploadRef = useRef<any>(null);
  // Single-select: uid of the MOST RECENT selection, recorded the moment
  // onChange fires (BEFORE any async read starts). A slow-decoding earlier
  // file must never overwrite a newer choice — checked both when a decode
  // finishes (enqueue) and when the debounce delivers the batch.
  const latestUidRef = useRef<string | number | null>(null);
  // Batches read within the 300ms debounce window ACCUMULATE here, keyed by
  // file uid (later reads of the same uid win). Without this, two rapid
  // selections would silently drop the first batch — debounce only delivers
  // its last call's arguments.
  const pendingRef = useRef(
    new Map<
      string | number,
      {
        dataUrl: string;
        uid: string | number;
        rawWidth: number;
        rawHeight: number;
      }
    >()
  );

  const getImgSize = useCallback(
    (url: string): Promise<{ rawWidth: number; rawHeight: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            rawWidth: round(img.width, 0),
            rawHeight: round(img.height, 0)
          });
        };
        img.onerror = () => {
          resolve({ rawWidth: 0, rawHeight: 0 });
        };
        img.src = url;
      });
    },
    []
  );

  const getBase64 = useCallback((file: RcFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const debouncedUpdate = useCallback(
    debounce(() => {
      if (pendingRef.current.size === 0) {
        return;
      }
      // Single-select: drop anything that is no longer the latest choice,
      // even if it already made it into the pending queue — the latest file
      // may still be decoding and will deliver on its own debounce.
      const batch = Array.from(pendingRef.current.values()).filter(
        (item) => multiple || item.uid === latestUidRef.current
      );
      pendingRef.current.clear();
      if (batch.length > 0) {
        handleUpdateImgList(batch);
      }
    }, 300),
    [handleUpdateImgList, intl, multiple]
  );

  const handleChange = useCallback(
    async (info: any) => {
      const { fileList } = info;
      // Record the latest selection BEFORE any reading starts, so a slow
      // decode of an earlier file can be recognized as stale later.
      if (!multiple && fileList.length > 0) {
        latestUidRef.current = fileList[fileList.length - 1].uid;
      }

      const newFileList = await Promise.all(
        fileList.map(
          async (
            item: UploadFile & { rawWidth: number; rawHeight: number }
          ) => {
            if (item.originFileObj && !item.url) {
              const base64 = await getBase64(item.originFileObj as RcFile);
              const { rawWidth, rawHeight } = await getImgSize(base64);

              item.url = base64;
              item.rawWidth = rawWidth;
              item.rawHeight = rawHeight;
            }
            return item;
          }
        )
      );

      for (const item of newFileList) {
        if (item.url) {
          // Single-select consumers (e.g. the image editor's source picker)
          // read only the FIRST delivered item, so accumulating would make
          // a quick re-selection keep the first image — deliver only the
          // latest selection instead. Multi-select accumulates by uid.
          if (!multiple) {
            if (item.uid !== latestUidRef.current) {
              // Stale decode: a newer selection arrived while this file was
              // being read. Drop it instead of letting it overwrite.
              continue;
            }
            pendingRef.current.clear();
          }
          pendingRef.current.set(item.uid, {
            dataUrl: item.url as string,
            uid: item.uid,
            rawWidth: item.rawWidth,
            rawHeight: item.rawHeight
          });
        }
      }
      if (pendingRef.current.size > 0) {
        debouncedUpdate();
      }
    },
    [debouncedUpdate, getBase64, multiple]
  );

  return (
    <>
      {drag ? (
        <Upload.Dragger
          ref={uploadRef}
          accept={accept}
          multiple={multiple}
          action="/"
          fileList={[]}
          beforeUpload={(file) => false}
          onChange={handleChange}
        >
          {children ?? (
            <Tooltip
              title={
                title ?? intl.formatMessage({ id: 'playground.img.upload' })
              }
            >
              <Button
                disabled={disabled}
                size={size}
                type="text"
                icon={icon ?? <PictureOutlined />}
              ></Button>
            </Tooltip>
          )}
        </Upload.Dragger>
      ) : (
        <Upload
          ref={uploadRef}
          accept={accept}
          multiple={multiple}
          action="/"
          fileList={[]}
          beforeUpload={(file) => false}
          onChange={handleChange}
        >
          {children ?? (
            <Tooltip
              title={
                title ?? intl.formatMessage({ id: 'playground.img.upload' })
              }
            >
              <Button
                disabled={disabled}
                size={size}
                type="text"
                icon={icon ?? <PictureOutlined />}
              ></Button>
            </Tooltip>
          )}
        </Upload>
      )}
    </>
  );
};

export default UploadImg;
