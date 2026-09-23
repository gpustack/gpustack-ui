import { roleLabel } from '@/pages/llmodels/components/pd/role-status';
import { AutoTooltip, TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Descriptions, Flex, Tag } from 'antd';
import React, { useMemo } from 'react';
import { useDetailContext } from '../../config/detail-context';
import DeploymentMembers from './deployment-members';
/** The member whose engine configuration the report describes.
 *
 * Not the endpoint, for a group: the endpoint is the router, which runs no
 * engine and holds no weights, so reading backend, parameters and model file
 * off it shows a report full of dashes for a deployment that has all three.
 * The GPU-bearing members of one group share these, so the first that has them
 * answers for the group. For every plain model it is the only member there is.
 */
const engineMember = (snapshot: any) => {
  const members = Object.values(snapshot?.instances || {}) as any[];
  return members.find((member) => member?.resolved_path) || members[0];
};

const Instance: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();

  const items = useMemo(() => {
    const { snapshot } = detailData;
    const instanceData = engineMember(snapshot);
    // Present only for a run that went through a route, and it is the fact
    // that names what was measured — a route's targets and weights can be
    // edited, so "which route" is part of what the numbers mean.
    const routeName = snapshot?.route_name;
    const specDigest = snapshot?.spec_digest;
    const endpointRole = (
      Object.values(snapshot?.instances || {}) as any[]
    ).find((member) => member?.name === detailData?.model_instance_name)?.role;
    return [
      {
        key: '1',
        label: intl.formatMessage({ id: 'benchmark.detail.modelName' }),
        children: (
          <AutoTooltip ghost>{detailData?.model_name || '-'}</AutoTooltip>
        )
      },
      {
        key: '2',
        label: intl.formatMessage({ id: 'benchmark.detail.instanceName' }),
        children: (
          <Flex align="center" gap={4}>
            <AutoTooltip ghost>
              {detailData?.model_instance_name || '-'}
            </AutoTooltip>
            {/* Which member the load was actually sent to. For a group that is
                the router, and saying so is what keeps the row from reading as
                "we benchmarked one arbitrary member of three". */}
            {endpointRole && (
              <TextAttribute>{roleLabel(intl, endpointRole)}</TextAttribute>
            )}
          </Flex>
        )
      },

      {
        // What was measured, which decides whether two reports can be
        // compared at all: an engine straight at its port, or the deployment
        // through the route clients call (every replica of a plain model).
        key: '4',
        label: intl.formatMessage({ id: 'benchmark.form.targetMode' }),
        children: (
          <AutoTooltip ghost>
            {routeName
              ? intl.formatMessage(
                  { id: 'benchmark.detail.targetMode.route' },
                  { route: routeName }
                )
              : intl.formatMessage({
                  id: 'benchmark.form.targetMode.instance'
                })}
          </AutoTooltip>
        )
      },
      {
        key: '5',
        label: intl.formatMessage({ id: 'models.form.backend' }),
        children: `${instanceData?.backend || '-'} ${
          instanceData?.backend_version
            ? `(${instanceData?.backend_version})`
            : ''
        }`
      },
      {
        key: '6',
        label: intl.formatMessage({ id: 'benchmark.detail.modelFile' }),
        children: (
          <AutoTooltip ghost>{instanceData?.resolved_path || '-'}</AutoTooltip>
        )
      },
      {
        // Which generation of the spec produced these numbers. Shown short
        // because nobody reads a hash — what it answers is "are these two
        // reports about the same configuration", and the full value is one
        // hover away for when that answer has to be exact.
        key: '7',
        label: intl.formatMessage({ id: 'benchmark.detail.specDigest' }),
        children: specDigest ? (
          <AutoTooltip ghost title={specDigest}>
            {specDigest.slice(0, 12)}
          </AutoTooltip>
        ) : (
          '-'
        )
      }
    ];
  }, [detailData]);

  const paramsItems = useMemo(() => {
    const { snapshot } = detailData;
    const instanceData = engineMember(snapshot);

    const renderParams = (params: string[]) =>
      params.length > 0 ? (
        <Flex
          gap={'4px 8px'}
          wrap="wrap"
          style={{
            backgroundColor: 'var(--ant-color-fill-quaternary)',
            padding: '4px 6px',
            borderRadius: '2px'
          }}
        >
          {params.map((param: string, index: number) => (
            <span key={index} style={{ margin: 0 }}>
              {param}
            </span>
          ))}
        </Flex>
      ) : (
        '-'
      );

    return [
      {
        key: '1',
        label: intl.formatMessage({
          id: 'models.form.backend_parameters'
        }),
        children: renderParams(instanceData?.backend_parameters || [])
      },
      {
        key: '3',
        label: intl.formatMessage({ id: 'benchmark.detail.kvCache' }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.extended_kv_cache?.enabled ? (
              <>
                {instanceData?.extended_kv_cache?.mode === 'shared' && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({
                        id: 'benchmark.detail.cacheService'
                      })}
                      :
                    </span>
                    <span>
                      {instanceData?.cache_service_name ||
                        `#${instanceData?.extended_kv_cache?.cache_service_id}`}
                    </span>
                  </span>
                )}
                {instanceData?.extended_kv_cache?.ram_ratio && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.ramRatio' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.ram_ratio}</span>
                  </span>
                )}

                {instanceData?.extended_kv_cache?.ram_size && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.ramSize' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.ram_size}</span>
                  </span>
                )}

                {instanceData?.extended_kv_cache?.chunk_size && (
                  <span className="flex-center">
                    <span>
                      {intl.formatMessage({ id: 'models.form.chunkSize' })}:
                    </span>
                    <span>{instanceData?.extended_kv_cache?.chunk_size}</span>
                  </span>
                )}
              </>
            ) : (
              '-'
            )}
          </Flex>
        )
      },
      {
        key: '2',
        label: intl.formatMessage({ id: 'models.form.env' }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.env
              ? Object.entries(instanceData?.env || {}).map(
                  ([key, value], index: number) => (
                    <Tag key={index} style={{ margin: 0 }}>
                      {`${key}=${value}`}
                    </Tag>
                  )
                )
              : '-'}
          </Flex>
        )
      },
      {
        key: '4',
        label: intl.formatMessage({
          id: 'benchmark.detail.speculativeDecoding'
        }),
        children: (
          <Flex gap={8} wrap="wrap">
            {instanceData?.speculative_config?.enabled ? (
              <>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.algorithm' })}:
                  </span>
                  <span>{instanceData?.speculative_config?.algorithm}</span>
                </span>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.draftModel' })}:
                  </span>
                  <span>{instanceData?.speculative_config?.draft_model}</span>
                </span>
                <span className="flex-center">
                  <span>
                    {intl.formatMessage({ id: 'models.form.numDraftTokens' })}:
                  </span>
                  <span>
                    {instanceData?.speculative_config?.num_draft_tokens}
                  </span>
                </span>
              </>
            ) : (
              '-'
            )}
          </Flex>
        )
      }
    ];
  }, [detailData]);

  return (
    <div>
      <Descriptions
        items={items}
        colon={false}
        column={4}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
      <Descriptions
        style={{ marginTop: '12px' }}
        items={paramsItems}
        colon={false}
        column={2}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
      {/* Everything above describes the deployment as a whole, read off one
          representative member. What differs BETWEEN members goes below, and
          only when there is more than one. */}
      <DeploymentMembers />
    </div>
  );
};

export default Instance;
