import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import YamlEditor from '@/pages/_components/yaml-editor';
import { useIntl } from '@umijs/max';
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { BackendSourceValueMap, yaml2Json, yamlTemplate } from '../config';
import createSchema from '../config/schema/create.json';
import updateBuiltinSchema from '../config/schema/update-builtin.json';
import udpateCustomSchema from '../config/schema/update-custom.json';

interface ImportYAMLProps {
  ref?: any;
  actionStatus: {
    action: PageActionType;
    backendSource: string;
  };
  content?: string;
  onSubmit?: (content: string) => void;
}

const ImportYAML: React.FC<ImportYAMLProps> = forwardRef(
  ({ actionStatus, content = '' }, ref) => {
    const intl = useIntl();
    const editorRef = useRef<any>(null);
    const [fileContent, setFileContent] = useState<string>(
      actionStatus.action === PageAction.CREATE ? yamlTemplate : content
    );
    const [error, setError] = useState<string>('');

    const setContent = (val: string) => {
      editorRef.current?.setValue?.(val);
    };

    const validate = () => {
      const markers = editorRef.current?.validate();
      if (markers && markers.length > 0) {
        setError(markers[0].message);
      }
      return markers.length === 0;
    };

    const getContent = () => {
      try {
        const content = editorRef.current?.getValue();

        const jsonData = yaml2Json(content);
        const exsistingVersions = Object.keys(jsonData.version_configs || {});
        console.log('exsistingVersions', jsonData);
        // Check backend version rules
        if (
          actionStatus.backendSource === BackendSourceValueMap.BUILTIN &&
          exsistingVersions.find((v) => !v?.endsWith('-custom'))
        ) {
          setError(intl.formatMessage({ id: 'backend.version.no.tips' }));
          return false;
        }

        // Check custom backend name rule
        if (
          actionStatus.backendSource === BackendSourceValueMap.CUSTOM &&
          actionStatus.action === PageAction.CREATE &&
          !jsonData.backend_name?.endsWith('-custom')
        ) {
          setError(intl.formatMessage({ id: 'backend.backend.rules.custom' }));
          return false;
        }

        // Check default version exists
        if (
          jsonData.default_version &&
          !exsistingVersions.includes(jsonData.default_version) &&
          actionStatus.backendSource === BackendSourceValueMap.CUSTOM
        ) {
          // the default_version must be in [existingVersions]
          setError(
            intl.formatMessage(
              { id: 'backend.version.default.not.exists' },
              { versions: exsistingVersions.join(', ') }
            )
          );
          return false;
        }

        setError('');

        return content;
      } catch (error) {
        setError((error as Error).message);
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return getContent();
      },
      setContent: setContent,
      validate() {
        return validate();
      }
    }));

    return (
      <YamlEditor
        ref={editorRef}
        value={fileContent}
        height={'calc(100vh - 260px)'}
        validateMessage={error}
        onUpload={(content) => {
          setError('');
          setContent(content);
        }}
        schema={
          actionStatus.action === PageAction.CREATE
            ? createSchema
            : actionStatus.backendSource === BackendSourceValueMap.BUILTIN
              ? updateBuiltinSchema
              : udpateCustomSchema
        }
      ></YamlEditor>
    );
  }
);

export default ImportYAML;
