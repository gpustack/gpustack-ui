import { formatNumber } from '@/utils';
import {
  DownloadOutlined,
  FolderOutlined,
  HeartOutlined
} from '@ant-design/icons';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
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
  isEvaluating?: boolean;
}

const HFModelItem: React.FC<HFModelItemProps> = (props) => {
  const { evaluateResult, isEvaluating } = props;

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
        {
          <IncompatiableInfo
            data={evaluateResult}
            isEvaluating={isEvaluating}
          ></IncompatiableInfo>
        }
      </div>
    </div>
  );
};

export default HFModelItem;
