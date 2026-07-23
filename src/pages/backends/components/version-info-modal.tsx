import { PlusOutlined } from '@ant-design/icons';
import { ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, message } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { updateBackend } from '../apis';
import { BackendSourceValueMap } from '../config';
import { VersionListItem } from '../config/types';
import VersionInfo from '../forms/version-info';

interface VersionInfoModalProps {
  open?: boolean;
  currentData?: any;
  addVersion?: () => void;
  onChanged?: () => void;
  onClose?: () => void;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  open,
  currentData,
  addVersion,
  onChanged,
  onClose
}) => {
  const intl = useIntl();
  const [versionConfigs, setVersionConfigs] = useState<VersionListItem[]>([]);
  const [disabledVersions, setDisabledVersions] = useState<string[]>([]);

  // Hide/show a version in the deploy dropdown by editing disabled_versions
  // on the backend row; keep a local copy so the switches stay responsive.
  const handleToggleVisibility = async (versionNo: string, hidden: boolean) => {
    const next = hidden
      ? [...disabledVersions, versionNo]
      : disabledVersions.filter((v) => v !== versionNo);
    try {
      await updateBackend(currentData.id, {
        data: { ...currentData, disabled_versions: next }
      });
      setDisabledVersions(next);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      onChanged?.();
    } catch (error) {
      // request layer surfaces the error message
    }
  };

  useEffect(() => {
    if (open && currentData) {
      setDisabledVersions(currentData.disabled_versions || []);
      // add is_built_in field to built_in_version_configs
      const builtInVersions = currentData.built_in_version_configs || {};
      for (const key in builtInVersions) {
        if (builtInVersions?.hasOwnProperty(key)) {
          builtInVersions[key].is_built_in =
            currentData.backend_source === BackendSourceValueMap.BUILTIN &&
            currentData.is_built_in;
        }
      }

      const versions = {
        ...builtInVersions,
        ...currentData.version_configs
      };
      const versionList: VersionListItem[] = Object.entries(versions).map(
        ([key, value]: [string, any]) => ({
          version_no: key,
          ..._.pick(value, [
            'image_name',
            'run_command',
            'entrypoint',
            'env',
            'backend_source'
          ]),
          is_default: key === currentData.default_version,
          availableFrameworks: [
            ...(value.built_in_frameworks || []),
            ...(value.custom_framework ? [value.custom_framework] : [])
          ],
          is_built_in: value.is_built_in || false
        })
      );

      setVersionConfigs(versionList);
    }
  }, [open, currentData]);

  return (
    <ScrollerModal
      open={open}
      title={
        <div className="flex-center gap-16">
          <span style={{ fontSize: 14 }}>
            {intl.formatMessage({ id: 'backend.versions' })}
          </span>
          <Button onClick={addVersion} type="link" size="small">
            <PlusOutlined /> {intl.formatMessage({ id: 'backend.addVersion' })}
          </Button>
        </div>
      }
      width={600}
      centered
      destroyOnHidden
      closable={true}
      mask={{
        closable: false
      }}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
    >
      <VersionInfo
        versionConfigs={versionConfigs}
        disabledVersions={disabledVersions}
        onToggleVisibility={handleToggleVisibility}
      />
    </ScrollerModal>
  );
};

export default VersionInfoModal;
