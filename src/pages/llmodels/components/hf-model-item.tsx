import { formatNumber } from '@/utils';
import {
  DownloadOutlined,
  FolderOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { Space, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import _ from 'lodash';
import { modelSourceMap } from '../config';
import '../style/hf-model-item.less';

interface HFModelItemProps {
  title: string;
  downloads: number;
  likes: number;
  lastModified: string;
  active: boolean;
  source?: string;
  tags?: string[];
}

const HFModelItem: React.FC<HFModelItemProps> = (props) => {
  return (
    <div
      className={classNames('hf-model-item', {
        active: props.active
      })}
    >
      <div className="title">
        <FolderOutlined className="m-r-5" />
        {props.title}
      </div>
      <div className="info">
        {props.source === modelSourceMap.huggingface_value ? (
          <Space size={16}>
            <span>
              {dayjs().to(
                dayjs(dayjs(props.lastModified).format('YYYY-MM-DD HH:mm:ss'))
              )}
            </span>
            <span>
              <HeartOutlined className="m-r-5" />
              {props.likes}
            </span>
            <span>
              <DownloadOutlined className="m-r-5" />
              {formatNumber(props.downloads)}
            </span>
          </Space>
        ) : (
          <Space size={10}>
            {_.map(props.tags, (tag: string) => {
              return (
                <Tag
                  style={{
                    backgroundColor: 'var(--color-white-1)',
                    marginRight: 0
                  }}
                >
                  <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                    {tag}
                  </span>
                </Tag>
              );
            })}
          </Space>
        )}
      </div>
    </div>
  );
};

export default HFModelItem;
