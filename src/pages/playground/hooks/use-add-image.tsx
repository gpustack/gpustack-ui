import DropDownActions from '@/components/drop-down-actions';
import {
  LinkOutlined,
  PictureOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import UploadImg from '../components/upload-img';

const regex = /(https?:\/\/\S+\.(png|jpg|jpeg))/gi;

const useAddImage = (options: {
  size?: 'small' | 'middle' | 'large';
  handleUpdateImgList: (
    list: { uid: number | string; dataUrl: string }[]
  ) => void;
  updateUidCount: () => number | string;
}) => {
  const { handleUpdateImgList, updateUidCount, size = 'middle' } = options;
  const intl = useIntl();
  const [isFromUrl, setIsFromUrl] = useState(false);
  const [openImgTips, setOpenImgTips] = useState(false);
  const inputImgRef = useRef<any>(null);

  const handleAddImgFromUrl = () => {
    setIsFromUrl(true);
    setTimeout(() => {
      inputImgRef.current?.focus?.();
    }, 100);
  };

  const handleInputImageUrl = (e: any) => {
    const url = e.target.value;
    const isValid = regex.test(url);
    setOpenImgTips(!isValid);
    if (isValid) {
      handleUpdateImgList([
        {
          uid: updateUidCount(),
          dataUrl: e.target.value
        }
      ]);
      setIsFromUrl(false);
    }

    setTimeout(() => {
      setOpenImgTips(false);
    }, 2000);
  };

  const handleOnEscape = (e: any) => {
    if (e.key === 'Escape') {
      setIsFromUrl(false);
      setOpenImgTips(false);
    }
  };

  const ImageURLInput = isFromUrl ? (
    <Tooltip
      open={openImgTips}
      title={intl.formatMessage({
        id: 'playground.uploadImage.url.invalid'
      })}
    >
      <Input
        ref={inputImgRef}
        status={openImgTips ? 'error' : ''}
        placeholder={intl.formatMessage({
          id: 'playground.uploadImage.url.holder'
        })}
        style={{ width: 360, height: 32 }}
        onBlur={handleInputImageUrl}
        onPressEnter={handleInputImageUrl}
        onKeyDown={handleOnEscape}
      ></Input>
    </Tooltip>
  ) : null;

  const UploadImageButton = (
    <DropDownActions
      placement={'topLeft'}
      menu={{
        items: [
          {
            label: (
              <UploadImg
                handleUpdateImgList={handleUpdateImgList}
                size="middle"
              >
                {intl.formatMessage({ id: 'playground.img.upload' })}
              </UploadImg>
            ),
            key: 'upload_image',
            icon: <UploadOutlined />
          },
          {
            label: intl.formatMessage({
              id: 'playground.uploadImage.url.button'
            }),
            key: 'add_image_url',
            icon: <LinkOutlined />,
            onClick: handleAddImgFromUrl
          }
        ]
      }}
    >
      <Button type="text" size={size} icon={<PictureOutlined />}></Button>
    </DropDownActions>
  );

  return {
    isFromUrl,
    ImageURLInput,
    UploadImageButton
  };
};

export default useAddImage;
