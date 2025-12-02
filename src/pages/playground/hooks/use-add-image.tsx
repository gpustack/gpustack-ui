import DropDownActions from '@/components/drop-down-actions';
import {
  DeleteOutlined,
  LinkOutlined,
  PictureOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import UploadImg from '../components/upload-img';

const ImgInputWrapper = styled.div`
  position: relative;
  .del-btn {
    display: none;
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--ant-color-bg-container);
  }
  &:hover {
    .del-btn {
      display: flex;
    }
  }
`;

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

  const handleInputImageUrl = async (e: any) => {
    const url = e.target.value?.trim();

    if (url) {
      handleUpdateImgList([
        {
          uid: updateUidCount(),
          dataUrl: url
        }
      ]);
      setOpenImgTips(false);
      setIsFromUrl(false);
    } else {
      setOpenImgTips(true);
    }
    // set openImgTips to false after next frame if is not valid
    if (!url) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setOpenImgTips(false);
        }, 3000);
      });
    }
  };

  const handleClose = () => {
    setIsFromUrl(false);
    setOpenImgTips(false);
  };

  const handleOnEscape = (e: any) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const ImageURLInput = isFromUrl ? (
    <Tooltip
      open={openImgTips}
      title={intl.formatMessage({
        id: 'playground.uploadImage.url.invalid'
      })}
    >
      <ImgInputWrapper>
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
        <div className="del-btn">
          <Button
            onClick={handleClose}
            icon={<DeleteOutlined />}
            size="small"
            type="text"
          ></Button>
        </div>
      </ImgInputWrapper>
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
                <UploadOutlined className="m-r-8" />
                {intl.formatMessage({ id: 'playground.img.upload' })}
              </UploadImg>
            ),
            key: 'upload_image'
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
