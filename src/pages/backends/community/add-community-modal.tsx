import { enabledBackendsAtom } from '@/atoms/backend';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import Separator from '@/pages/llmodels/components/separator';
import { useIntl } from '@umijs/max';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ListItem } from '../config/types';
import useEnableBackend from '../services/use-enable-backend';
import BackendDetail from './backend-detail';
import CommunityBackends from './commnity-backends';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
`;

const AddCommunityModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}> = ({ open, onClose, onRefresh }) => {
  const intl = useIntl();
  const { handleEnableBackend } = useEnableBackend();
  const [currentData, setCurrentData] = React.useState<any>(null);
  const [, setEnabledBackendAtom] = useAtom(enabledBackendsAtom);

  const handleOnEnable = async (checked: boolean, data: ListItem) => {
    await handleEnableBackend({
      id: data.id,
      data: {
        ...data,
        enabled: checked
      }
    });
    setEnabledBackendAtom({
      ...data,
      enabled: checked
    });
    onRefresh?.();
  };

  const handleOnClick = (data: ListItem) => {
    setCurrentData(data);
  };

  useEffect(() => {
    if (!open) {
      setEnabledBackendAtom(null);
    }
  }, [open]);

  return (
    <GSDrawer
      open={open}
      title={intl.formatMessage({ id: 'backend.community.title' })}
      footer={false}
      onClose={onClose}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        wrapper: { width: 'max(50vw, 900px)' }
      }}
    >
      <Container>
        <div
          style={{
            display: 'flex'
          }}
        >
          <ColumnWrapper
            maxHeight={'calc(100vh - 90px)'}
            styles={{
              container: {
                paddingTop: 0
              }
            }}
          >
            <CommunityBackends
              onClick={handleOnClick}
              onEnable={handleOnEnable}
            ></CommunityBackends>
          </ColumnWrapper>
          <Separator
            styles={{
              arrow: {
                top: 8
              }
            }}
          ></Separator>
        </div>
        <ColumnWrapper
          maxHeight={'calc(100vh - 90px)'}
          styles={{
            container: {
              paddingTop: 0
            }
          }}
        >
          <BackendDetail
            onEnable={handleOnEnable}
            data={currentData}
          ></BackendDetail>
        </ColumnWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddCommunityModal;
