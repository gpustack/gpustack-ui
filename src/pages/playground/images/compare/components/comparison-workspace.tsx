import { HEADER_HEIGHT } from '@/config/settings';
import { useOverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Empty, Flex, Row } from 'antd';
import classNames from 'classnames';
import { ReactNode, useEffect, useRef } from 'react';
import { ImageComparisonLayout, ImageModelSelection } from '../config/types';
import styles from './comparison-workspace.module.less';

interface ComparisonWorkspaceProps {
  layout: ImageComparisonLayout;
  modelSelections: ImageModelSelection[];
  loaded?: boolean;
  renderPanel: (model: ImageModelSelection) => ReactNode;
  footer: ReactNode;
}

export default function ComparisonWorkspace({
  layout,
  modelSelections,
  loaded,
  renderPanel,
  footer
}: ComparisonWorkspaceProps) {
  const intl = useIntl();
  const { initialize } = useOverlayScroller();
  const scroller = useRef<HTMLDivElement>(null);
  const boxHeight = `calc(100vh - var(--app-banner-height, 0px) - ${HEADER_HEIGHT}px - 2px - var(--page-header-height) - var(--page-content-padding) - var(--page-content-padding))`;
  useEffect(() => {
    if (scroller.current) initialize(scroller.current);
  }, [initialize]);
  return (
    <Flex vertical className="image-compare" style={{ height: boxHeight }}>
      <div className={styles.panels} ref={scroller}>
        <div style={{ height: '100%' }}>
          {modelSelections.length > 0 ? (
            <Row gutter={16} className={styles.grid}>
              {modelSelections.map((model) => (
                <Col
                  xs={24}
                  md={layout.span}
                  key={`${model.value || 'empty'}-${model.uid}`}
                  className={classNames(styles.panelColumn, {
                    [styles.halfHeight]: layout.count >= 4
                  })}
                >
                  {renderPanel(model)}
                </Col>
              ))}
            </Row>
          ) : (
            loaded && (
              <Flex align="center" justify="center" style={{ height: '100%' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={intl.formatMessage({
                    id: 'playground.model.noavailable'
                  })}
                />
              </Flex>
            )
          )}
        </div>
      </div>
      <div>{footer}</div>
    </Flex>
  );
}
