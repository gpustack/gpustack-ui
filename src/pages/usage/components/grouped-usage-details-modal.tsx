import { LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons';
import { AutoTooltip, OverlayScroller, ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Input, List, Typography } from 'antd';
import React, { useRef, useState } from 'react';

export type UsageGroupBy = 'route' | 'user' | 'api_key';

export interface GroupedUsageDetail {
  date: string;
  groupBy: UsageGroupBy;
  rows: { key: number; name: string; value: number }[];
}

const PAGE_SIZE = 20;

const groupCopy: Record<
  UsageGroupBy,
  { title: string; search: string; name: string }
> = {
  route: {
    title: 'usage.filter.group.model',
    search: 'usage.chart.searchModels',
    name: 'usage.chart.modelName'
  },
  user: {
    title: 'usage.filter.group.user',
    search: 'usage.chart.searchUsers',
    name: 'usage.chart.userName'
  },
  api_key: {
    title: 'usage.chart.apiKeyDetails',
    search: 'usage.chart.searchApiKeys',
    name: 'usage.chart.apiKeyName'
  }
};

const GroupedUsageDetailsModal: React.FC<{
  detail: GroupedUsageDetail;
  open: boolean;
  onClose: () => void;
}> = ({ detail, open, onClose }) => {
  const intl = useIntl();
  const [filter, setFilter] = useState({ query: '', page: 1 });
  const listRef = useRef<HTMLDivElement>(null);
  const copy = groupCopy[detail.groupBy];
  const query = filter.query.trim().toLocaleLowerCase();
  const filteredRows = query
    ? detail.rows.filter((row) => row.name.toLocaleLowerCase().includes(query))
    : detail.rows;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const page = Math.min(filter.page, pageCount);

  const scrollToTop = () => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-overlayscrollbars-viewport]')
      ?.scrollTo({ top: 0 });
  };
  const handleClose = () => {
    setFilter({ query: '', page: 1 });
    onClose();
  };

  return (
    <ScrollerModal
      title={
        <Flex align="center" gap={12}>
          <span>{intl.formatMessage({ id: copy.title })}</span>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              fontWeight: 400,
              border: '1px solid var(--ant-color-border-secondary)',
              borderRadius: 4,
              padding: '2px 8px'
            }}
          >
            {detail.date}
          </Typography.Text>
        </Flex>
      }
      open={open}
      onCancel={handleClose}
      footer={
        <Flex justify="space-between" align="center" wrap gap={12}>
          <Typography.Text type="secondary">
            {intl.formatMessage(
              { id: 'usage.chart.groupCount' },
              { count: filteredRows.length }
            )}
          </Typography.Text>
          <Flex align="center" gap={8}>
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              aria-label={intl.formatMessage({
                id: 'usage.chart.previousPage'
              })}
              disabled={page === 1}
              onClick={() => {
                setFilter((previous) => ({ ...previous, page: page - 1 }));
                scrollToTop();
              }}
            />
            <Typography.Text style={{ whiteSpace: 'nowrap' }}>
              {intl.formatMessage(
                { id: 'usage.chart.pageOf' },
                { page, total: pageCount }
              )}
            </Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              aria-label={intl.formatMessage({ id: 'usage.chart.nextPage' })}
              disabled={page === pageCount}
              onClick={() => {
                setFilter((previous) => ({ ...previous, page: page + 1 }));
                scrollToTop();
              }}
            />
          </Flex>
        </Flex>
      }
      width={640}
      style={{ maxWidth: 'calc(100vw - 32px)', top: '6vh' }}
      maxContentHeight="calc(100vh - 180px)"
      destroyOnHidden
    >
      <Flex vertical>
        <Flex
          vertical
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--ant-color-bg-elevated)',
            paddingBottom: 12
          }}
        >
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={intl.formatMessage({ id: copy.search })}
            value={filter.query}
            onChange={(event) => {
              setFilter({ query: event.target.value, page: 1 });
              scrollToTop();
            }}
            style={{ width: '100%' }}
          />
        </Flex>
        <div ref={listRef}>
          <OverlayScroller
            maxHeight="max(120px, calc(100vh - 300px))"
            style={{ overscrollBehavior: 'contain' }}
          >
            <Flex
              justify="space-between"
              gap={16}
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                backgroundColor: 'var(--ant-color-bg-elevated)',
                paddingInline: 12,
                paddingBottom: 8,
                borderBottom: '1px solid var(--ant-color-border-secondary)'
              }}
            >
              <Typography.Text
                style={{
                  minWidth: 0,
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-table-header)'
                }}
              >
                {intl.formatMessage({ id: copy.name })}
              </Typography.Text>
              <Typography.Text
                style={{
                  width: 148,
                  textAlign: 'right',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-table-header)'
                }}
              >
                {intl.formatMessage({ id: 'usage.metric.usage' })}
              </Typography.Text>
            </Flex>
            <List
              className="usage-group-detail-list"
              dataSource={filteredRows.slice(
                (page - 1) * PAGE_SIZE,
                page * PAGE_SIZE
              )}
              locale={{
                emptyText: intl.formatMessage({ id: 'usage.common.noData' })
              }}
              renderItem={(row) => (
                <List.Item>
                  <Flex
                    justify="space-between"
                    align="center"
                    gap={16}
                    style={{ width: '100%', minWidth: 0 }}
                  >
                    <AutoTooltip ghost style={{ minWidth: 0, flex: 1 }}>
                      {row.name}
                    </AutoTooltip>
                    <Typography.Text
                      style={{
                        width: 148,
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {row.value.toLocaleString()}
                    </Typography.Text>
                  </Flex>
                </List.Item>
              )}
            />
          </OverlayScroller>
        </div>
      </Flex>
    </ScrollerModal>
  );
};

export default GroupedUsageDetailsModal;
