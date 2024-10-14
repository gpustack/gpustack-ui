import { readBlob, readExcelContent, readWordContent } from '@/utils';
import { PaperClipOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { RcFile } from 'antd/es/upload';
import { debounce } from 'lodash';
import React, { useCallback, useRef } from 'react';

interface UploadImgProps {
  size?: 'small' | 'middle' | 'large';
  accept?: string;
  children?: React.ReactNode;
  handleUpdateFileList: (
    fileList: { text: string; name: string; uid: number | string }[]
  ) => void;
}

const UploadImg: React.FC<UploadImgProps> = ({
  handleUpdateFileList,
  size = 'small',
  accept = '.txt,.doc,.docx',
  children
}) => {
  const intl = useIntl();
  const uploadRef = useRef<any>(null);

  const wordReg = /\.(doc|docx)$/;
  const excelReg = /\.(xls|xlsx)$/;

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
      (files: { text: string; name: string; uid: number | string }[]) => {
        handleUpdateFileList(files);
      },
      300
    ),
    [handleUpdateFileList, intl]
  );

  const handleChange = useCallback(
    async (info: any) => {
      try {
        const { fileList } = info;

        const newFileList = await Promise.all(
          fileList.map(async (item: UploadFile) => {
            if (wordReg.test(item.name)) {
              const context = await readWordContent(
                item.originFileObj as RcFile
              );
              item.url = context;
            } else if (excelReg.test(item.name)) {
              const context = await readExcelContent(
                item.originFileObj as RcFile
              );
              item.url = context;
            } else {
              const context = await readBlob(item.originFileObj as RcFile);
              item.url = context;
            }
            return item;
          })
        );

        if (newFileList.length > 0) {
          const files = newFileList
            .filter((sitem) => sitem.url)
            .map((item: UploadFile) => {
              return {
                text: item.url as string,
                name: item.name as string,
                uid: item.uid
              };
            });

          debouncedUpdate(files);
        }
      } catch (error) {
        // console.log('error', error);
      }
    },
    [debouncedUpdate, getBase64]
  );

  return (
    <>
      <Upload.Dragger
        ref={uploadRef}
        multiple
        action="/"
        accept={accept}
        fileList={[]}
        beforeUpload={(file) => false}
        onChange={handleChange}
      >
        {children ? (
          children
        ) : (
          <Tooltip title={intl.formatMessage({ id: 'playground.upload' })}>
            <Button size={size} icon={<PaperClipOutlined />} />
          </Tooltip>
        )}
      </Upload.Dragger>
    </>
  );
};

export default React.memo(UploadImg);
