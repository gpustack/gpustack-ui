import IconFont from '@/components/icon-font';
import SimpleOverlay from '@/components/simple-overlay';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Col, Empty, Row, Spin } from 'antd';
import React, { useMemo } from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import { modelSourceMap } from '../config';
import '../style/search-result.less';
import HFModelItem from './hf-model-item';

interface SearchResultProps {
  resultList: any[];
  onSelect?: (item: any) => void;
  current?: string;
  source?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  networkError?: boolean;
  isEvaluating?: boolean;
}

const SearchResult: React.FC<SearchResultProps> = (props) => {
  const { resultList, onSelect, isEvaluating, source, networkError } = props;
  const intl = useIntl();

  const handleSelect = (e: any, item: any) => {
    e.stopPropagation();
    onSelect?.(item);
  };
  const handleOnEnter = (e: any, item: any) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      onSelect?.(item);
    }
  };

  const renderEmpty = useMemo(() => {
    if (networkError) {
      return (
        <Empty
          imageStyle={{ height: 'auto', marginTop: '20px' }}
          image={
            <IconFont
              type="icon-networkerror"
              style={{
                color: 'var(--ant-color-text-tertiary)',
                fontSize: '66px'
              }}
            ></IconFont>
          }
          description={
            source === modelSourceMap.huggingface_value ? (
              <div className="flex-column gap-5">
                <span>
                  {intl.formatMessage({ id: 'models.search.networkerror' })}
                </span>
                <span>
                  <span>
                    {intl.formatMessage({ id: 'models.search.hfvisit' })}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    href="https://huggingface.co/"
                    target="_blank"
                  >
                    Hugging Face
                  </Button>
                </span>
              </div>
            ) : null
          }
        />
      );
    }
    return (
      <Empty
        imageStyle={{ height: 'auto', marginTop: '20px' }}
        image={
          <SearchOutlined
            className="font-size-16"
            style={{ color: 'var(--ant-color-text-tertiary)' }}
          ></SearchOutlined>
        }
        description={intl.formatMessage({ id: 'models.search.noresult' })}
      />
    );
  }, [networkError, source, intl]);

  return (
    <SimpleOverlay style={{ height: 'calc(100vh - 224px)' }}>
      <div style={{ ...props.style }} className="search-result-wrap">
        <Spin spinning={props.loading}>
          <div style={{ minHeight: 200 }}>
            {resultList.length ? (
              <Row gutter={[16, 24]}>
                {resultList.map((item, index) => (
                  <Col span={24} key={item.name}>
                    <div
                      onClick={(e) => handleSelect(e, item)}
                      onKeyDown={(e) => handleOnEnter(e, item)}
                    >
                      <HFModelItem
                        source={source}
                        tags={item.tags}
                        key={index}
                        title={item.name}
                        downloads={item.downloads}
                        likes={item.likes}
                        task={item.task}
                        updatedAt={item.updatedAt}
                        evaluateResult={item.evaluateResult}
                        active={item.id === props.current}
                        isEvaluating={isEvaluating}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              !props.loading && renderEmpty
            )}
          </div>
        </Spin>
      </div>
    </SimpleOverlay>
  );
};

export default React.memo(SearchResult);
