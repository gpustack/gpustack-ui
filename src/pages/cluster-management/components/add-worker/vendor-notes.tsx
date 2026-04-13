import { ExclamationCircleFilled } from '@ant-design/icons';
import { AlertBlockInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useAddWorkerContext } from './add-worker-context';
import { NotesWrapper } from './constainers';

const VendorNotes = () => {
  const intl = useIntl();
  const { summary } = useAddWorkerContext();
  const workerCommand =
    summary.get('workerCommand') ||
    ({
      label: '',
      notes: []
    } as { label: string; notes: string[] });

  return (
    <AlertBlockInfo
      maxHeight={200}
      title={intl.formatMessage(
        { id: 'clusters.addworker.vendorNotes.title' },
        { vendor: workerCommand.label }
      )}
      style={{ marginBottom: 8 }}
      type="warning"
      contentStyle={{
        paddingLeft: 16
      }}
      icon={<ExclamationCircleFilled />}
      message={
        workerCommand.notes?.length > 0 ? (
          <NotesWrapper>
            {workerCommand.notes.map((note: string, index: number) => (
              <li
                key={index}
                dangerouslySetInnerHTML={{
                  __html: intl.formatMessage({ id: note })
                }}
              ></li>
            ))}
          </NotesWrapper>
        ) : null
      }
    ></AlertBlockInfo>
  );
};

export default VendorNotes;
