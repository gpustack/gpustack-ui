import { roleLabel } from '@/pages/llmodels/components/pd/role-status';
import { AutoTooltip, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Table } from 'antd';
import React from 'react';
import { useDetailContext } from '../../config/detail-context';

// What differs BETWEEN the members of one deployment.
//
// The card above this one describes the deployment as a whole, reading one
// representative member. That is right for the model file and the settings a
// group genuinely shares.
//
// It is wrong for everything in this table. Role, placement, the version the
// engine actually reported, the parameters the server injected and the
// environment each member ran with are per member — and on a disaggregated
// group they are exactly what a reader is looking for, because prefill and
// decode are configured differently on purpose (`env` and
// `backend_parameters` are overridable per role for that reason; on Ascend
// 910B2 they differ down to `HCCL_CONNECT_TIMEOUT`). Reading them off one
// member would state one role's configuration as the whole deployment's.
//
// Hidden for a single-member deployment: one row restating the card above it is
// noise.
const DeploymentMembers: React.FC = () => {
  const intl = useIntl();
  const { detailData } = useDetailContext();
  const members = Object.values(detailData?.snapshot?.instances || {}) as any[];

  if (members.length < 2) {
    return null;
  }

  const endpointName = detailData?.model_instance_name;

  const columns = [
    {
      title: intl.formatMessage({ id: 'benchmark.detail.members.role' }),
      dataIndex: 'role',
      width: 120,
      render: (role: string) =>
        role ? <ThemeTag>{roleLabel(intl, role)}</ThemeTag> : '-'
    },
    {
      title: intl.formatMessage({ id: 'benchmark.detail.instanceName' }),
      dataIndex: 'name',
      width: 260,
      render: (name: string) => (
        <Flex align="center" gap={4}>
          <AutoTooltip ghost>{name}</AutoTooltip>
          {/* The member the load was actually sent to. Without it a group's
              table reads as several equal members, when one of them is the
              address every request went through. */}
          {name === endpointName && (
            <ThemeTag color="geekblue">
              {intl.formatMessage({ id: 'benchmark.detail.members.endpoint' })}
            </ThemeTag>
          )}
        </Flex>
      )
    },
    {
      title: intl.formatMessage({ id: 'benchmark.env.workerName' }),
      dataIndex: 'worker_name',
      width: 200,
      render: (worker: string, record: any) => {
        // A member can span machines (distributed serving); listing only its
        // primary would under-report where it ran.
        const extra = (record.subordinate_workers || [])
          .map((sub: any) => sub.worker_name)
          .filter(Boolean);
        return (
          <AutoTooltip ghost>
            {[worker, ...extra].filter(Boolean).join(', ') || '-'}
          </AutoTooltip>
        );
      }
    },
    {
      title: 'GPU',
      dataIndex: 'gpu_indexes',
      width: 110,
      render: (indexes: number[]) =>
        indexes?.length ? indexes.join(', ') : '-'
    },
    {
      title: intl.formatMessage({ id: 'models.form.backend' }),
      dataIndex: 'backend_version',
      width: 200,
      render: (version: string, record: any) => {
        // Prefer what the engine reported over what was configured: on a
        // group they can differ per member, and the reported one is what
        // actually served the load.
        const detected = record.api_detected_backend_version || version;
        return (
          <AutoTooltip ghost>
            {[record.backend, detected && `(${detected})`]
              .filter(Boolean)
              .join(' ') || '-'}
          </AutoTooltip>
        );
      }
    },
    {
      // The parameters the server added on top of the model's own — the PD
      // wiring (which role, which peer, which transfer channel) lives here, so
      // this column is where prefill and decode visibly diverge.
      title: intl.formatMessage({ id: 'benchmark.detail.members.injected' }),
      dataIndex: 'injected_backend_parameters',
      width: 320,
      render: (params: string[]) =>
        params?.length ? (
          <Flex gap={'4px 8px'} wrap="wrap">
            {params.map((param: string) => (
              <span key={param}>{param}</span>
            ))}
          </Flex>
        ) : (
          '-'
        )
    },
    {
      // Per-role overrides land here, and on a PD group they are where prefill
      // and decode actually diverge — measured on Ascend 910B2 they differ down
      // to `HCCL_CONNECT_TIMEOUT` (120 vs 1200). The status this replaced was
      // the one column that said nothing about the configuration: every member
      // of a finished run is `running`, and a member that was not would have
      // failed the run rather than shown up here with a different word.
      title: intl.formatMessage({ id: 'models.form.env' }),
      dataIndex: 'env',
      width: 320,
      render: (env: Record<string, string>) => {
        const entries = Object.entries(env || {});
        return entries.length ? (
          <Flex gap={'4px 8px'} wrap="wrap">
            {entries.map(([key, value]) => (
              <ThemeTag key={key}>{`${key}=${value}`}</ThemeTag>
            ))}
          </Flex>
        ) : (
          '-'
        );
      }
    }
  ];

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 8,
          color: 'var(--ant-color-text-tertiary)'
        }}
      >
        {intl.formatMessage({ id: 'benchmark.detail.members.title' })}
      </div>
      <Table
        size="small"
        className="scroll-table"
        scroll={{ x: 'max-content' }}
        columns={columns}
        dataSource={members}
        rowKey="name"
        pagination={false}
      />
    </div>
  );
};

export default DeploymentMembers;
