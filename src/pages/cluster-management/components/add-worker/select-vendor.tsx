import {
  AddWorkerDockerNotes,
  GPUDriverMap,
  GPUsConfigs
} from '@/pages/resources/config/gpu-driver';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { queryClusterItem } from '../../apis';
import { ProviderValueMap } from '../../config';
import { ClusterListItem } from '../../config/types';
import SupportedGPUs from '../support-gpus';
import { useAddWorkerContext } from './add-worker-context';
import { AddWorkerStepProps, StepNamesMap } from './config';
import { Title } from './constainers';
import StepCollapse from './step-collapse';

const buildWorkerCommand = (
  driverKey: string,
  itemHint?: { label?: string; link?: string }
) => ({
  label: itemHint?.label || GPUsConfigs[driverKey]?.label || driverKey,
  link: itemHint?.link || '',
  notes: AddWorkerDockerNotes[driverKey] || []
});

const SelectVendor: React.FC<AddWorkerStepProps> = ({ disabled }) => {
  const { stepList, registerField, updateField, provider, registrationInfo } =
    useAddWorkerContext();
  const intl = useIntl();

  const stepIndex = stepList.indexOf(StepNamesMap.SelectGPU) + 1;

  // Pull the cluster so we know whether gpuVendorOverrides was configured.
  // The K8s register flow gates multi-select on that being present, and
  // restricts available runtimes to its keys.
  const [overrideRuntimes, setOverrideRuntimes] = useState<string[]>([]);
  useEffect(() => {
    const id = registrationInfo?.cluster_id;
    if (!id) {
      // Reset when the cluster context goes away so we don't leak the
      // previous cluster's overrides into the next session.
      setOverrideRuntimes([]);
      return;
    }
    let cancelled = false;
    queryClusterItem({ id })
      .then((c) => {
        if (cancelled) return;
        const overrides = (c as ClusterListItem)?.k8s_options
          ?.gpuVendorOverrides;
        setOverrideRuntimes(overrides ? Object.keys(overrides) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to query cluster for vendor overrides:', err);
        setOverrideRuntimes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [registrationInfo?.cluster_id]);

  // Set of GPU *driver keys* (e.g. "cuda", "cann") that match the cluster's
  // override runtimes. Used to detect when multi-add becomes available.
  const overrideKeys = useMemo(() => {
    const set = new Set<string>();
    if (!overrideRuntimes.length) return set;
    Object.values(GPUsConfigs).forEach((cfg) => {
      if (cfg.gpuVendor && overrideRuntimes.includes(cfg.gpuVendor)) {
        set.add(cfg.value);
      }
    });
    return set;
  }, [overrideRuntimes]);

  // Multi-add is only meaningful when the cluster has 2+ vendor overrides
  // AND the current selection already includes one. Until both hold, the
  // picker behaves like a single-select (so the user can freely land on
  // any vendor — including ones outside the override list).
  const multiCapable =
    provider === ProviderValueMap.Kubernetes && overrideKeys.size >= 2;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    GPUDriverMap.NVIDIA
  ]);

  const isMultiActive = useMemo(
    () => multiCapable && selectedKeys.some((k) => overrideKeys.has(k)),
    [multiCapable, selectedKeys, overrideKeys]
  );

  // In multi-active mode, non-override vendors are disabled — picking one
  // would break the backend invariant that a multi-vendor manifest must
  // only target configured runtimes. Otherwise everything stays enabled.
  const availableKeys = isMultiActive ? overrideKeys : undefined;

  // Cache vendor metadata (label/link from SupportedGPUs items) so we can
  // rebuild workerCommand on toggle without re-clicking the card.
  const itemMetaRef = useRef<Record<string, { label: string; link: string }>>(
    {}
  );

  // Push current selection into the shared summary so consumers
  // (K8sRunCommand, CheckEnvironment, VendorNotes) can read it.
  useEffect(() => {
    const primary = selectedKeys[0] || '';
    updateField('currentGPU', primary);
    updateField('selectedGPUs', selectedKeys);
    updateField(
      'workerCommand',
      primary ? buildWorkerCommand(primary, itemMetaRef.current[primary]) : null
    );
  }, [selectedKeys]);

  useEffect(() => {
    const unregister1 = registerField('currentGPU');
    const unregister2 = registerField('workerCommand');
    const unregister3 = registerField('selectedGPUs');
    return () => {
      unregister1();
      unregister2();
      unregister3();
    };
  }, []);

  const handleSelect = (key: string, item: any) => {
    // Disabled cards are already blocked by TemplateCard; this is a
    // defensive check for the multi-active case (only override runtimes
    // can be added once multi-add is open).
    if (availableKeys && !availableKeys.has(key)) return;
    if (item) {
      itemMetaRef.current[key] = {
        label: item.label,
        link: item.link
      };
    }
    setSelectedKeys((prev) => {
      const has = prev.includes(key);
      if (has) {
        // Clicking a selected card always toggles it off.
        return prev.filter((v) => v !== key);
      }
      // Multi-add only when the current state already includes an override
      // pick. Otherwise (still in single-select land), replace.
      if (isMultiActive) return [...prev, key];
      return [key];
    });
  };

  // Warn when multi-select is possible on this cluster but the user's
  // current pick lands outside the override list — they're effectively
  // locked into single-select until they switch to an override vendor.
  const showSingleOnlyHint =
    multiCapable &&
    selectedKeys.length > 0 &&
    selectedKeys.every((k) => !overrideKeys.has(k));

  return (
    <StepCollapse
      disabled={disabled}
      name={StepNamesMap.SelectGPU}
      title={
        <Title>
          {stepIndex}.{' '}
          {intl.formatMessage({ id: 'clusters.addworker.selectGPU' })}
          {multiCapable && (
            <Tag
              color="blue"
              style={{
                marginLeft: 8,
                fontWeight: 400,
                borderRadius: 4
              }}
            >
              {intl.formatMessage({
                id: 'clusters.addworker.selectGPU.multiTag'
              })}
            </Tag>
          )}
        </Title>
      }
    >
      {showSingleOnlyHint && (
        <Alert
          type="info"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 8 }}
          message={intl.formatMessage({
            id: 'clusters.addworker.selectGPU.singleOnly'
          })}
        />
      )}
      <SupportedGPUs
        onSelect={handleSelect}
        current={selectedKeys}
        availableKeys={availableKeys}
        clickable={true}
      />
    </StepCollapse>
  );
};

export default SelectVendor;
