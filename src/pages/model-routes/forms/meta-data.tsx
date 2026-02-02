import SingleImage from '@/components/auto-image/single-image';
import ListInput from '@/components/list-input';
import SealInputNumber from '@/components/seal-form/input-number';
import SealInput from '@/components/seal-form/seal-input';
import UploadImg from '@/pages/playground/components/upload-img';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import styled from 'styled-components';
import { FormData } from '../config/types';

const SizeWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 16px;
`;

const UploadWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IconBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  .icon {
    color: var(--ant-color-text-tertiary);
    font-size: 14px;
    line-height: 1;
  }
`;

const MetaData = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const icon = Form.useWatch(['meta', 'icon'], form);

  const handleMetadataChange = (list: string[], field: string) => {
    form.setFieldValue(['meta', field], list);
  };

  const handleUpdateImageList = (fileList: any[]) => {
    if (fileList.length === 0) {
      return;
    }
    form.setFieldValue(['meta', 'icon'], fileList[0]?.dataUrl || null);
  };

  const handleDeleteIcon = () => {
    form.setFieldValue(['meta', 'icon'], null);
  };

  return (
    <>
      <SizeWrapper>
        <Form.Item<FormData>
          data-field="metaSize"
          name={['meta', 'size']}
          normalize={(v) => (v === 0 ? null : v)}
        >
          <SealInputNumber
            min={0}
            label={`${intl.formatMessage({ id: 'routes.form.metadata.size' })} (B)`}
          ></SealInputNumber>
        </Form.Item>
        <Form.Item<FormData>
          name={['meta', 'activated_size']}
          normalize={(v) => (v === 0 ? null : v)}
        >
          <SealInputNumber
            min={0}
            label={`${intl.formatMessage({
              id: 'routes.form.metadata.activeSize'
            })} (B)`}
          ></SealInputNumber>
        </Form.Item>
      </SizeWrapper>
      <SizeWrapper>
        <Form.Item<FormData> name={['meta', 'max_tokens']}>
          <SealInput.Input
            label={intl.formatMessage({
              id: 'routes.form.metadata.maxTokens'
            })}
            placeholder={intl.formatMessage(
              { id: 'common.help.eg' },
              { content: 'context/128k' }
            )}
          ></SealInput.Input>
        </Form.Item>
        <Form.Item<FormData>
          name={['meta', 'dimensions']}
          normalize={(v) => (v === 0 ? null : v)}
        >
          <SealInputNumber
            min={0}
            step={1}
            precision={0}
            label={intl.formatMessage({
              id: 'routes.form.metadata.dimension'
            })}
          ></SealInputNumber>
        </Form.Item>
      </SizeWrapper>
      <Form.Item<FormData> name={['meta', 'release_date']}>
        <SealInput.Input
          label={intl.formatMessage({
            id: 'routes.form.metadata.releaseDate'
          })}
          placeholder={intl.formatMessage(
            { id: 'common.help.eg' },
            { content: '2025-05-19' }
          )}
        ></SealInput.Input>
      </Form.Item>
      <Form.Item<FormData> name={['meta', 'tags']} data-field="metadata">
        <ListInput
          label={intl.formatMessage({ id: 'resources.form.label' })}
          btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          dataList={[]}
          onChange={(list: string[]) => handleMetadataChange(list, 'tags')}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name={['meta', 'licenses']} data-field="metadata">
        <ListInput
          label={intl.formatMessage({ id: 'routes.form.metadata.license' })}
          btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          dataList={[]}
          onChange={(list: string[]) => handleMetadataChange(list, 'licenses')}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name={['meta', 'languages']} data-field="metadata">
        <ListInput
          label={intl.formatMessage({ id: 'routes.form.metadata.languages' })}
          btnText={intl.formatMessage({ id: 'common.button.addLabel' })}
          dataList={[]}
          onChange={(list: string[]) => handleMetadataChange(list, 'languages')}
        ></ListInput>
      </Form.Item>
      <Form.Item<FormData> name={['meta', 'icon']} data-field="metadata">
        <IconBox>
          <span className="icon">
            {intl.formatMessage({ id: 'routes.form.metadata.icons' })}
          </span>
          <UploadWrapper>
            <UploadImg
              handleUpdateImgList={handleUpdateImageList}
              size="middle"
            >
              {icon ? (
                <SingleImage
                  uid={1}
                  editable={true}
                  onDelete={handleDeleteIcon}
                  dataUrl={icon}
                  preview={false}
                />
              ) : (
                <Button size="middle" variant="dashed" color="default">
                  {intl.formatMessage({
                    id: 'routes.form.metadata.uploadIcon'
                  })}
                </Button>
              )}
            </UploadImg>
          </UploadWrapper>
        </IconBox>
      </Form.Item>
    </>
  );
};

export default MetaData;
