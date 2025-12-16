import AutoTooltip from '@/components/auto-tooltip';
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../style/file-list.less';

interface FileListProps {
  fileList: { text: string; name: string; uid: number | string }[];
  ghost?: boolean;
  showIcon?: boolean;
  textListCount: number;
  onDelete?: (uid: number | string) => void;
}

const FileList: React.FC<FileListProps> = (props) => {
  const { textListCount, fileList, ghost, showIcon = true, onDelete } = props;
  const intl = useIntl();
  return (
    <div className="file-list">
      {fileList.map((file, index) => {
        return (
          <div key={file.uid} className={classNames('file-item', { ghost })}>
            <span className="title">
              <span className="m-r-5">{index + 1 + textListCount}.</span>
              {showIcon && <PaperClipOutlined className="m-r-5" />}
              <AutoTooltip ghost> {file.name}</AutoTooltip>
            </span>
            {onDelete && (
              <Tooltip
                title={intl.formatMessage({ id: 'common.button.delete' })}
              >
                <Button
                  danger
                  size="small"
                  type="text"
                  className="delete-btn"
                  icon={<DeleteOutlined></DeleteOutlined>}
                  onClick={() => onDelete(file.uid)}
                ></Button>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileList;
