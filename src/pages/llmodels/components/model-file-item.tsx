import { TooltipOverlayScroller } from '@/components/overlay-scroller';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { convertFileSize } from '@/utils';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { getFileType } from '../config/file-type';
import '../style/hf-model-file.less';
import FileParts from './file-parts';
import IncompatiableInfo from './incompatiable-info';

interface ModelFileItemProps {
  data: Record<string, any>;
  isEvaluating: boolean;
  active: boolean;
  handleSelectModelFile: (item: any) => void;
}

const FilePartsTag = (props: { parts: any[] }) => {
  const { parts } = props;
  const intl = useIntl();
  if (!props.parts || !props.parts.length) {
    return null;
  }

  return (
    <TooltipOverlayScroller title={<FileParts fileList={parts}></FileParts>}>
      <ThemeTag
        opacity={0.7}
        className="tag-item"
        color="purple"
        style={{
          marginRight: 0
        }}
      >
        <span style={{ opacity: 1 }}>
          <InfoCircleOutlined className="m-r-5" />
          {intl.formatMessage(
            { id: 'models.search.parts' },
            { n: parts.length }
          )}
        </span>
      </ThemeTag>
    </TooltipOverlayScroller>
  );
};

const ModelFileItem: React.FC<ModelFileItemProps> = (props) => {
  const { data: item, isEvaluating, active, handleSelectModelFile } = props;

  const getModelQuantizationType = (item: any) => {
    let path = item.path;
    if (item?.parts?.length) {
      path = `${item.path}.gguf`;
    }
    const quanType = getFileType(path);
    if (quanType) {
      return (
        <ThemeTag
          opacity={0.7}
          className="tag-item"
          color="cyan"
          style={{
            marginRight: 0
          }}
        >
          {_.toUpper(quanType)}
        </ThemeTag>
      );
    }
    return null;
  };

  return (
    <div
      className={classNames('hf-model-file', {
        active: active
      })}
      onClick={() => handleSelectModelFile(item)}
    >
      <div className="title">{item.path}</div>
      <div className="tags flex-between">
        <span className="flex-center gap-8">
          <ThemeTag
            opacity={0.7}
            className="tag-item"
            color="green"
            style={{
              marginRight: 0
            }}
          >
            {convertFileSize(item.size)}
          </ThemeTag>
          {getModelQuantizationType(item)}
          <FilePartsTag parts={item.parts}></FilePartsTag>
        </span>
        <IncompatiableInfo
          isEvaluating={isEvaluating}
          data={item.evaluateResult}
        ></IncompatiableInfo>
      </div>
    </div>
  );
};

export default ModelFileItem;
