import { PictureOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { RcFile } from 'antd/es/upload';
import { debounce } from 'lodash';
import React, { useCallback, useRef } from 'react';

interface UploadImgProps {
  size?: 'small' | 'middle' | 'large';
  handleUpdateImgList: (
    imgList: { dataUrl: string; uid: number | string }[]
  ) => void;
}

const UploadImg: React.FC<UploadImgProps> = ({
  handleUpdateImgList,
  size = 'small'
}) => {
  const intl = useIntl();
  const uploadRef = useRef<any>(null);

  const getBase64 = useCallback((file: RcFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const debouncedUpdate = useCallback(
    debounce((base64List: { dataUrl: string; uid: number | string }[]) => {
      handleUpdateImgList(base64List);
    }, 300),
    [handleUpdateImgList, intl]
  );

  const handleChange = useCallback(
    async (info: any) => {
      const { fileList } = info;

      const newFileList = await Promise.all(
        fileList.map(async (item: UploadFile) => {
          if (item.originFileObj && !item.url) {
            const base64 = await getBase64(item.originFileObj as RcFile);
            item.url = base64;
          }
          return item;
        })
      );

      if (newFileList.length > 0) {
        const base64List = newFileList
          .filter((sitem) => sitem.url)
          .map((item: UploadFile) => {
            return {
              dataUrl: item.url as string,
              uid: item.uid
            };
          });

        debouncedUpdate(base64List);
      }
    },
    [debouncedUpdate, getBase64]
  );

  return (
    <>
      <Upload
        ref={uploadRef}
        accept="image/*"
        multiple
        action="/"
        fileList={[]}
        beforeUpload={(file) => false}
        onChange={handleChange}
      >
        <Tooltip title={intl.formatMessage({ id: 'playground.img.upload' })}>
          <Button size={size} type="text" icon={<PictureOutlined />}></Button>
        </Tooltip>
      </Upload>
    </>
  );
};

export default React.memo(UploadImg);
