import fallbackImg from '@/assets/images/img.png';
import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { modelCategories } from '../config';
import { CatalogItem as CatalogItemType } from '../config/types';
import '../style/catalog-item.less';
import { categoryConfig } from './model-tag';

interface CatalogItemProps {
  activeId: number;
  data: CatalogItemType;
  onClick: (data: CatalogItemType) => void;
}
const CatalogItem: React.FC<CatalogItemProps> = (props) => {
  const intl = useIntl();
  const { onClick, activeId, data } = props;

  const handleOnClick = useCallback(() => {
    onClick(data);
  }, [data, onClick]);

  const handleOnError = (e: any) => {
    e.target.src = fallbackImg;
  };

  const description = useMemo(() => {
    return (
      <Typography.Paragraph
        className="desc"
        ellipsis={{
          rows: 2,
          tooltip: (
            <div
              className="custome-scrollbar"
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                maxHeight: 300,
                maxWidth: 300,
                overflow: 'auto'
              }}
            >
              {data.description}
            </div>
          )
        }}
      >
        {data.description}
      </Typography.Paragraph>
    );
  }, [data.description]);

  return (
    <div
      onClick={handleOnClick}
      className={classNames('catalog-item', { active: activeId === data.id })}
    >
      <div className="content">
        <div className="title">
          <div className="img">
            <img
              src={data.icon || fallbackImg}
              alt=""
              onError={handleOnError}
            />
          </div>
          <AutoTooltip ghost>{data.name}</AutoTooltip>
        </div>
      </div>
      <div className="item-footer">
        <div className="update-time">
          <span
            className="flex-center"
            title={intl.formatMessage({ id: 'models.catalog.release.date' })}
          >
            <IconFont
              type="icon-new_release_outlined"
              className="m-r-5"
              style={{ color: 'var(--ant-color-text-secondary)' }}
            ></IconFont>
            {data.release_date}
          </span>
          <span className="flex-center">
            {_.map(data.licenses, (license: string, index: number) => {
              return (
                <span key={license} className="flex-center m-r-8">
                  <IconFont type="icon-justice1" className="m-r-5"></IconFont>
                  <span>{license}</span>
                </span>
              );
            })}
          </span>
        </div>
        <div className="tags gap-6">
          {data.categories.map((sItem, i) => {
            return (
              <ThemeTag
                icon={categoryConfig[sItem]?.icon}
                key={sItem}
                className="tag-item"
                color={categoryConfig[sItem]?.color || 'blue'}
                opacity={0.7}
              >
                {_.find(modelCategories, { value: sItem })?.label || sItem}
              </ThemeTag>
            );
          })}
          {data.capabilities?.length > 0 &&
            data.capabilities.map((sItem, i) => {
              return (
                <ThemeTag
                  key={sItem}
                  className="tag-item"
                  color="purple"
                  opacity={0.7}
                >
                  {_.map(_.split(sItem, '/'), (s: string) => {
                    return _.split(s, '_').join(' ');
                  })
                    .reverse()
                    .join(' ')}
                </ThemeTag>
              );
            })}

          {data.size > 0 && (
            <>
              <span className="dot"></span>
              <AutoTooltip
                style={{
                  borderRadius: 4
                }}
              >
                {data.activated_size
                  ? `${data.size}${data.size_unit || 'B'}-A${data.activated_size}${data.size_unit || 'B'}`
                  : `${data.size}${data.size_unit || 'B'}`}
              </AutoTooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogItem;
