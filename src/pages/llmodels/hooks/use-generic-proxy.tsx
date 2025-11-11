import ScrollerModal from '@/components/scroller-modal';
import CommandViewer from '@/pages/_components/command-viewer';
import { GPUSTACK_API, OPENAI_COMPATIBLE } from '@/pages/playground/apis';
import { formatCurlArgs } from '@/pages/playground/view-code/utils';
import { useIntl } from '@umijs/max';
import { useState } from 'react';

const langOptions = [{ label: 'Curl', value: 'bash' }];

const generateCode = ({ api: url, parameters }: Record<string, any>) => {
  const host = window.location.origin;
  const api = url.replace(OPENAI_COMPATIBLE, GPUSTACK_API);

  // ========================= Curl =========================
  const curlCode = `
curl ${host}${api} \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\
${formatCurlArgs(parameters, false)}`.trim();
};

const useGenericProxy = () => {
  const intl = useIntl();
  const [modalStatus, setModalStatus] = useState<{
    open: boolean;
    codeValue: string;
  }>({ open: false, codeValue: '' });

  const onCancel = () => {
    setModalStatus({
      open: false,
      codeValue: ''
    });
  };

  const openProxyModal = (data?: any) => {
    setModalStatus({
      open: true,
      codeValue: data?.generic_proxy_command || ''
    });
  };

  const GenericProxyModal = () => {
    return (
      <ScrollerModal
        title={intl.formatMessage({
          id: 'models.form.generic_title.button'
        })}
        open={modalStatus.open}
        centered={true}
        onCancel={onCancel}
        destroyOnHidden={true}
        closeIcon={true}
        maskClosable={false}
        keyboard={false}
        width={700}
        footer={false}
      >
        <CommandViewer
          code={modalStatus.codeValue}
          copyText={modalStatus.codeValue}
          options={langOptions}
          defaultValue={'bash'}
        ></CommandViewer>
      </ScrollerModal>
    );
  };

  return {
    GenericProxyModal,
    openProxyModal,
    setModalStatus
  };
};

export default useGenericProxy;
