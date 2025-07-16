import CopyButton from '@/components/copy-button';
import UploadAudio from '@/components/upload-audio';
import {
  audioTypeMap,
  convertFileToBase64,
  readAudioFile
} from '@/utils/load-audio-file';
import {
  CustomerServiceOutlined,
  EditOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import { Roles } from '../../config';
import {
  AudioFormat,
  MessageItem,
  MessageItemAction
} from '../../config/types';
import UploadImg from '../upload-img';

interface MessageActionsProps {
  data: MessageItem;
  actions: MessageItemAction[];
  loading?: boolean;
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  actions,
  data,
  loading,
  updateMessage,
  onDelete,
  onEdit
}) => {
  const intl = useIntl();

  const handleUpdateImgList = (
    list: { uid: number | string; dataUrl: string }[]
  ) => {
    updateMessage?.({
      role: data.role,
      content: data.content,
      uid: data.uid,
      audio: data.audio || [],
      imgs: [...(data.imgs || []), ...list]
    });
  };

  const handleUploadAudioChange = async (audio: {
    file: any;
    fileList: any[];
  }) => {
    const base64Audio = await convertFileToBase64(audio.file);
    const audioData = await readAudioFile(audio.file);
    updateMessage?.({
      role: data.role,
      content: data.content,
      uid: data.uid,
      imgs: data.imgs || [],
      audio: [
        {
          uid: audio.file.uid || audio.fileList[0].uid,
          format: audioTypeMap[audio.file.type] as AudioFormat,
          base64: base64Audio.split(',')[1],
          data: _.pick(audioData, ['url', 'name', 'duration'])
        }
      ]
    });
  };

  return (
    <>
      {actions.length > 1 && !loading ? (
        <div className="actions">
          <div className="actions-wrap gap-5">
            {actions.includes('upload') && data.role === Roles.User && (
              <UploadImg handleUpdateImgList={handleUpdateImgList} />
            )}
            {actions.includes('upload') && data.role === Roles.User && (
              <UploadAudio
                type="text"
                maxFileSize={1024 * 1024}
                accept={'.mp3,.wav'}
                size="small"
                shape="default"
                icon={<CustomerServiceOutlined />}
                onChange={handleUploadAudioChange}
              ></UploadAudio>
            )}
            {actions.includes('edit') && data.role === Roles.Assistant && (
              <Tooltip title={intl.formatMessage({ id: 'common.button.edit' })}>
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                />
              </Tooltip>
            )}
            {data.content && actions.includes('copy') && (
              <CopyButton
                text={data.content}
                size="small"
                shape="default"
                type="text"
                fontSize="12px"
              />
            )}
            {actions.includes('delete') && (
              <Tooltip
                title={intl.formatMessage({ id: 'common.button.delete' })}
              >
                <Button
                  size="small"
                  type="text"
                  onClick={onDelete}
                  icon={<MinusCircleOutlined />}
                />
              </Tooltip>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MessageActions;
