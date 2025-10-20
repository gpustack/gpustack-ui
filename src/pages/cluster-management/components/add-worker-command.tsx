import HighlightCode from '@/components/highlight-code';
import { addWorkerGuide } from '@/pages/resources/config';
import React from 'react';

type ViewModalProps = {
  registrationInfo: {
    token: string;
    image: string;
    server_url: string;
  };
};

const AddWorkerCommand: React.FC<ViewModalProps> = ({ registrationInfo }) => {
  const code = React.useMemo(() => {
    const commandCode = addWorkerGuide['all'];
    return commandCode?.registerWorker({
      server: registrationInfo.server_url || origin,
      tag: '',
      image: registrationInfo.image,
      token: registrationInfo.token || '${token}',
      workerip: '${workerip}'
    });
  }, [registrationInfo]);

  return (
    <HighlightCode
      theme="dark"
      code={code}
      copyValue={code}
      lang="bash"
    ></HighlightCode>
  );
};

export default AddWorkerCommand;
