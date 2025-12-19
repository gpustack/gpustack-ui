import ScrollerModal from '@/components/scroller-modal';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { VersionListItem } from '../config/types';
import VersionInfo from '../forms/version-info';

interface VersionInfoModalProps {
  open?: boolean;
  currentData?: any;
  addVersion?: () => void;
  onClose?: () => void;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  open,
  currentData,
  addVersion,
  onClose
}) => {
  const intl = useIntl();
  const [versionConfigs, setVersionConfigs] = useState<VersionListItem[]>([]);

  useEffect(() => {
    if (open && currentData) {
      // add is_built_in field to built_in_version_configs
      const builtInVersions = currentData.built_in_version_configs || {};

      for (const key in builtInVersions) {
        if (builtInVersions?.hasOwnProperty(key)) {
          builtInVersions[key].is_built_in = true;
        }
      }

      const versions = {
        ...builtInVersions,
        ...currentData.version_configs
      };

      const versionList: VersionListItem[] = Object.entries(versions).map(
        ([key, value]: [string, any]) => ({
          version_no: key,
          image_name: value.image_name,
          run_command: value.run_command,
          entrypoint: value.entrypoint,
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
          <span>{intl.formatMessage({ id: 'backend.versions' })}</span>
          <Button onClick={addVersion} type="link" size="small">
            <PlusOutlined /> {intl.formatMessage({ id: 'backend.addVersion' })}
          </Button>
        </div>
      }
      width={600}
      centered
      destroyOnHidden
      closable={true}
      maskClosable={false}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
    >
      <VersionInfo versionConfigs={versionConfigs} />
    </ScrollerModal>
  );
};

export default VersionInfoModal;
