import HighlightCode from '@/components/highlight-code';
import React, { useEffect } from 'react';
import { queryClusterToken } from '../apis';
import { generateRegisterCommand } from '../config';
import { ClusterListItem as ListItem } from '../config/types';

type AddModalProps = {
  data: ListItem;
};
const AddCluster: React.FC<AddModalProps> = ({ data }) => {
  const [code, setCode] = React.useState<string>('');
  const getToken = async () => {
    const res = await queryClusterToken(data?.id);
    return res.data?.token || '';
  };

  const getCode = async () => {
    try {
      const token = await getToken();
      const command = generateRegisterCommand({
        server: window.location.origin,
        clusterId: data?.id || 0,
        registrationToken: token
      });
      setCode(command);
    } catch (error) {
      setCode(
        generateRegisterCommand({
          server: window.location.origin,
          clusterId: data?.id || 0,
          registrationToken: '{token}'
        })
      );
    }
  };

  useEffect(() => {
    getCode();
  }, []);

  return (
    <div>
      <HighlightCode
        theme="dark"
        code={code.replace(/\\/g, '')}
        copyValue={code}
        lang="bash"
      ></HighlightCode>
    </div>
  );
};

export default AddCluster;
