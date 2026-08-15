import useUserSettings from '@/hooks/use-user-settings';
import { json2Yaml, yaml2Json } from '@/pages/backends/config';
import { ModalFooter, useSubmitLock } from '@gpustack/core-ui';
import { YamlEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { FormData, ListItem } from '../config/types';

// Fields the update endpoint owns: identity and audit columns (id,
// owner_principal_id, creator_id, timestamps) are server-managed, so the
// YAML carries exactly what a PUT may change.
const YAML_FIELDS = [
  'name',
  'displayName',
  'description',
  'manufacturer',
  'spec'
];

// Drop null-valued keys (recursively) so the editor opens with meaningful
// content only; unset fields stay absent rather than reading as explicit
// nulls.
const stripNulls = (value: any): any => {
  if (_.isArray(value)) {
    return value.map(stripNulls);
  }
  if (_.isPlainObject(value)) {
    return _.mapValues(_.omitBy(value, _.isNull), stripNulls);
  }
  return value;
};

type EditYamlModalProps = {
  open: boolean;
  currentData: ListItem;
  onOk: (id: number, values: FormData) => Promise<void> | void;
  onCancel: () => void;
};

const EditYamlModal: React.FC<EditYamlModalProps> = ({
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const editorRef = useRef<any>(null);
  // ``run`` (not ``guard``): guard's lock is only released by a nested run,
  // so a parse failure inside guard would wedge every later Save click.
  const { loading, run } = useSubmitLock();
  const [error, setError] = useState('');

  const content = json2Yaml(stripNulls(_.pick(currentData, YAML_FIELDS)));

  // The core-ui YamlEditor creates its monaco model under a fixed path, so a
  // remount reuses the previous model instead of the new `value` prop — push
  // the intended content imperatively. YamlEditor buffers the call until the
  // editor is up, so this needs no wait of its own.
  useEffect(() => {
    editorRef.current?.setValue(content);
  }, []);

  const handleOk = () =>
    run(async () => {
      try {
        const parsed = yaml2Json(editorRef.current?.getValue() ?? '');
        if (
          !_.isPlainObject(parsed) ||
          !_.isPlainObject((parsed as any).spec)
        ) {
          throw new Error(
            intl.formatMessage({
              id: 'gpuservice.template.editYaml.invalidSpec'
            })
          );
        }
        setError('');
        // Keep the payload inside the PUT-mutable shape: anything else the
        // user typed (id, audit fields) is dropped client-side.
        await onOk(currentData.id, _.pick(parsed, YAML_FIELDS) as FormData);
      } catch (e) {
        setError((e as Error).message);
      }
    });

  return (
    <Modal
      title={intl.formatMessage({ id: 'gpuservice.template.editYaml.title' })}
      open={open}
      onCancel={onCancel}
      width={720}
      maskClosable={false}
      footer={
        <ModalFooter
          onOk={handleOk}
          onCancel={onCancel}
          loading={loading}
          style={{
            padding: '16px 0 8px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <YamlEditor
        ref={editorRef}
        value={content}
        height="calc(100vh - 320px)"
        validateMessage={error}
        isDarkTheme={isDarkTheme}
      />
    </Modal>
  );
};

export default EditYamlModal;
