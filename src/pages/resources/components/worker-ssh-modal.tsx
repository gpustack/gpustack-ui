import { DownloadOutlined } from '@ant-design/icons';
import { HighlightCode, ModalFooter, ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Descriptions, type DescriptionsProps } from 'antd';
import React from 'react';
import { downloadWorkerPrivateKey } from '../apis';
import { ListItem } from '../config/types';
import {
  resolveSSHAccess,
  workerPrivateKeyFilename
} from '../utils/ssh-access';

interface WorkerSSHModalProps {
  open: boolean;
  currentData: ListItem | null;
  onClose: () => void;
}

const WorkerSSHModal: React.FC<WorkerSSHModalProps> = ({
  open,
  currentData,
  onClose
}) => {
  const intl = useIntl();
  const access = currentData ? resolveSSHAccess(currentData) : null;

  if (!currentData) {
    return null;
  }

  // The key exists from the moment provisioning starts, the endpoint only once
  // the instance is up. Show whichever half is ready rather than nothing: a
  // pending worker still has a key worth downloading.
  const pending = intl.formatMessage({ id: 'resources.worker.ssh.pending' });
  const keyFile = workerPrivateKeyFilename(currentData.id);
  const command = access
    ? `ssh -i ${keyFile} -p ${access.port} ${access.user}@${access.host}`
    : '';

  const handleDownload = () => {
    downloadWorkerPrivateKey({ id: currentData.id });
  };

  // Four cells over two columns: the download sits in the grid as the private
  // key's value rather than in the footer, which both fills the row and keeps
  // the key next to the command that consumes it.
  const items: DescriptionsProps['items'] = [
    {
      key: 'host',
      label: intl.formatMessage({ id: 'resources.worker.ssh.host' }),
      children: access?.host || pending
    },
    {
      key: 'port',
      label: intl.formatMessage({ id: 'resources.worker.ssh.port' }),
      children: access?.port || pending
    },
    {
      key: 'user',
      label: intl.formatMessage({ id: 'common.table.user' }),
      children: access?.user || pending
    },
    {
      key: 'privatekey',
      label: intl.formatMessage({ id: 'resources.worker.ssh.privatekey' }),
      children: (
        <Button
          type="link"
          size="small"
          icon={<DownloadOutlined />}
          style={{ paddingInline: 0 }}
          onClick={handleDownload}
        >
          {intl.formatMessage({ id: 'resources.worker.download.privatekey' })}
        </Button>
      )
    }
  ];

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'resources.worker.ssh.title' })}
      open={open}
      centered={true}
      onCancel={onClose}
      destroyOnHidden={true}
      closeIcon={true}
      width={600}
      footer={
        <ModalFooter
          showOkBtn={false}
          onCancel={onClose}
          cancelText={intl.formatMessage({ id: 'common.button.close' })}
        ></ModalFooter>
      }
    >
      <Descriptions
        items={items}
        colon={false}
        column={2}
        layout="vertical"
        styles={{
          content: {
            justifyContent: 'flex-start'
          }
        }}
      ></Descriptions>
      {/* No endpoint yet means no command to give: an `ssh` line with a
          blank host would be worse than its absence. */}
      {!!access && (
        <>
          <h4 className="m-t-10 m-b-6 font-size-13">
            {intl.formatMessage({ id: 'resources.worker.ssh.command' })}
          </h4>
          <HighlightCode
            theme="dark"
            lang="bash"
            code={command}
            copyValue={command}
            xScrollable={true}
          ></HighlightCode>
        </>
      )}
      <p
        className="m-t-6 m-b-0 font-size-12"
        style={{ color: 'var(--ant-color-text-tertiary)' }}
      >
        {intl.formatMessage({ id: 'resources.worker.ssh.tip' })}
      </p>
    </ScrollerModal>
  );
};

export default WorkerSSHModal;
