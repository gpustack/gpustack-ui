import { formatNumber } from '@/utils';
import {
  DownloadOutlined,
  FolderOutlined,
  HeartOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { modelSourceMap } from '../config';
import { EvaluateResult } from '../config/types';
import '../style/hf-model-item.less';
import IncompatiableInfo from './incompatiable-info';

interface HFModelItemProps {
  title: string;
  downloads: number;
  likes: number;
  task?: string;
  updatedAt: string;
  active: boolean;
  source?: string;
  tags?: string[];
  evaluateResult?: EvaluateResult;
}
const warningTask = ['video'];

const SUPPORTEDSOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const HFModelItem: React.FC<HFModelItemProps> = (props) => {
  const { evaluateResult } = props;
  console.log('evaluateResult', evaluateResult);
  const intl = useIntl();
  const isExcludeTask = useMemo(() => {
    if (!props.task) {
      return false;
    }
    return _.some(warningTask, (item: string) => {
      return props.task?.toLowerCase().includes(item);
    });
  }, [props.task]);

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
        {isExcludeTask && (
          <Tooltip
            title={intl.formatMessage({ id: 'models.search.unsupport' })}
          >
            <WarningOutlined className="m-l-2" style={{ color: 'orange' }} />
          </Tooltip>
        )}
      </div>
      <div className="info">
        <div className="info-item">
          <span>{dayjs().to(dayjs(props.updatedAt))}</span>
          <span className="flex-center">
            <HeartOutlined className="m-r-5" />
            {props.likes}
          </span>
          <span className="flex-center">
            <DownloadOutlined className="m-r-5" />
            {formatNumber(props.downloads)}
          </span>
        </div>
        {<IncompatiableInfo data={evaluateResult}></IncompatiableInfo>}
      </div>
    </div>
  );
};

export default HFModelItem;
