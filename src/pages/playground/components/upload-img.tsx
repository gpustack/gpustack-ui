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
    debounce(
      (
        base64List: {
          dataUrl: string;
          uid: number | string;
          rawWidth: number;
          rawHeight: number;
        }[]
      ) => {
        handleUpdateImgList(base64List);
      },
      300
    ),
    [handleUpdateImgList, intl]
  );

  const handleChange = useCallback(
    async (info: any) => {
      const { fileList } = info;

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

      if (newFileList.length > 0) {
        const base64List = newFileList
          .filter((sitem) => sitem.url)
          .map((item: UploadFile & { rawHeight: number; rawWidth: number }) => {
            return {
              dataUrl: item.url as string,
              uid: item.uid,
              rawWidth: item.rawWidth,
              rawHeight: item.rawHeight
            };
          });

        debouncedUpdate(base64List);
      }
    },
    [debouncedUpdate, getBase64]
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
