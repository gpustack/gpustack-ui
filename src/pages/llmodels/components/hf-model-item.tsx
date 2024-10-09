import { formatNumber } from '@/utils';
import {
  DownloadOutlined,
  FolderOutlined,
  HeartOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import _ from 'lodash';
import { modelSourceMap } from '../config';
import '../style/hf-model-item.less';

interface HFModelItemProps {
  title: string;
  downloads: number;
  likes: number;
  task?: string;
  updatedAt: string;
  active: boolean;
  source?: string;
  tags?: string[];
}
const warningTask = ['audio', 'video'];

const SUPPORTEDSOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const HFModelItem: React.FC<HFModelItemProps> = (props) => {
  const intl = useIntl();
  const isExcludeTask = () => {
    if (!props.task) {
      return false;
    }
    return _.some(warningTask, (item: string) => {
      return props.task?.toLowerCase().includes(item);
    });
  };
  return (
    <div
      tabIndex={0}
      className={classNames('hf-model-item', {
        active: props.active
      })}
    >
      <div className="title">
        <FolderOutlined
          className="m-r-5"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
        />
        {props.title}
        {isExcludeTask() && (
          <Tooltip
            title={intl.formatMessage({ id: 'models.search.unsupport' })}
          >
            <WarningOutlined className="m-l-2" style={{ color: 'orange' }} />
          </Tooltip>
        )}
      </div>
      <div className="info">
        {SUPPORTEDSOURCE.includes(props.source || '') ? (
          <div className="info-item">
            <span>
              {dayjs().to(
                dayjs(dayjs(props.updatedAt).format('YYYY-MM-DD HH:mm:ss'))
              )}
            </span>
            <span className="flex-center">
              <HeartOutlined className="m-r-5" />
              {props.likes}
            </span>
            <span className="flex-center">
              <DownloadOutlined className="m-r-5" />
              {formatNumber(props.downloads)}
            </span>
          </div>
        ) : (
          <div className="flex-between">
            <div className="tags">
              {_.map(props.tags, (tag: string, index: string) => {
                return (
                  <Tag
                    key={index}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HFModelItem;
