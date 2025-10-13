import ScrollerModal from '@/components/scroller-modal';
import { useIntl } from '@umijs/max';
import { useEffect, useState } from 'react';
import { VersionListItem } from '../config/types';
import VersionInfo from '../forms/version-info';

interface VersionInfoModalProps {
  open?: boolean;
  currentData?: any;
  onClose?: () => void;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  open,
  currentData,
  onClose
}) => {
  const intl = useIntl();
  const [versionConfigs, setVersionConfigs] = useState<VersionListItem[]>([]);

  useEffect(() => {
    if (open && currentData) {
      // add is_built_in field to build_in_version_configs
      const builtInVersions = currentData.build_in_version_configs || {};

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
          is_default: key === currentData.default_version,
          availableFrameworks: [
            ...(value.build_in_frameworks || []),
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
      title={intl.formatMessage({ id: 'backend.versions' })}
      width={600}
      centered
      destroyOnHidden
      closable={true}
      maskClosable={false}
      onOk={onClose}
      onCancel={onClose}
      styles={{
        content: {
          padding: '0 0 16px 0'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '16px 24px 32px'
        },
        footer: {
          padding: '16px 24px',
          margin: '0'
        }
      }}
      footer={null}
    >
      <VersionInfo versionConfigs={versionConfigs} />
    </ScrollerModal>
  );
};

export default VersionInfoModal;
