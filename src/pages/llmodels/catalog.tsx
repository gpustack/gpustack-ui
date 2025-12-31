import { modelsExpandKeysAtom, modelsSessionAtom } from '@/atoms/models';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import useBodyScroll from '@/hooks/use-body-scroll';
import useTableFetch from '@/hooks/use-table-fetch';
import { ScrollerContext } from '@/pages/_components/infinite-scroller/use-scroller-context';
import { IS_FIRST_LOGIN, writeState } from '@/utils/localstore/index';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
import { createModel, queryCatalogItemSpec, queryCatalogList } from './apis';
import CatalogList from './components/catalog-list';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { modelCategories, modelSourceMap } from './config';
import { CatalogItem as CatalogItemType, FormData } from './config/types';

const Catalog: React.FC = () => {
  const intl = useIntl();
  const {
    dataSource,
    queryParams,
    handleSearch,
    handleQueryChange,
    loadMore,
    handleNameChange
  } = useTableFetch<CatalogItemType>({
    fetchAPI: queryCatalogList,
    watch: false,
    isInfiniteScroll: true,
    defaultQueryParams: {
      perPage: 24
    }
  });
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const navigate = useNavigate();

  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    current: {},
    source: modelSourceMap.huggingface_value
  });
  const [, setModelsExpandKeys] = useAtom(modelsExpandKeysAtom);
  const [, setModelsSession] = useAtom(modelsSessionAtom);
  const sourceRef = React.useRef<string>('');

  const categoryOptions = [
    ...modelCategories.filter((item) => item.value)
  ] as Global.BaseOption<string>[];

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
    restoreScrollHeight();
  };

  const handleOnDeploy = useCallback(async (item: CatalogItemType) => {
    saveScrollHeight();
    setOpenDeployModal({
      show: true,
      source: sourceRef.current,
      current: item,
      width: 600
    });
  }, []);

  const handleCreateModel = useCallback(
    async (data: FormData) => {
      try {
        const modelData = await createModel({
          data: {
            ..._.omit(data, ['size', 'quantization'])
          }
        });
        writeState(IS_FIRST_LOGIN, false);
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        setModelsExpandKeys([modelData.id]);
        navigate('/models/deployments');
      } catch (error) {}
    },
    [openDeployModal]
  );

  const handleCategoryChange = (value: any) => {
    handleQueryChange({
      categories: value
    });
  };

  const handleDeployFromOtherHubs = async () => {
    try {
      setModelsSession({
        source: sourceRef.current || modelSourceMap.huggingface_value
      });
    } catch (error) {}
    navigate('/models/deployments');
  };

  useEffect(() => {
    if (dataSource.loadend) {
      const getCatalogSource = async () => {
        try {
          const id = dataSource.dataList?.[0]?.id;
          const res: any = await queryCatalogItemSpec({
            id,
            cluster_id: null
          });
          sourceRef.current = res?.items?.[0]?.source;
        } catch (error) {}
      };
      getCatalogSource();
    }
  }, [dataSource.loadend]);

  return (
    <PageBox>
      <FilterBar
        showSelect={true}
        selectHolder={intl.formatMessage({ id: 'models.filter.category' })}
        marginBottom={22}
        marginTop={0}
        buttonText={intl.formatMessage({ id: 'models.catalog.button.explore' })}
        handleSearch={handleSearch}
        handleSelectChange={handleCategoryChange}
        handleClickPrimary={handleDeployFromOtherHubs}
        handleInputChange={handleNameChange}
        selectOptions={categoryOptions}
        buttonIcon={<SearchOutlined />}
        width={{ input: 230, select: 200 }}
      ></FilterBar>
      <ScrollerContext.Provider
        value={{
          total: dataSource.totalPage,
          current: queryParams.page,
          loading: dataSource.loading,
          refresh: loadMore,
          throttleDelay: 300
        }}
      >
        <CatalogList
          dataList={dataSource.dataList}
          loading={dataSource.loading}
          onDeploy={handleOnDeploy}
          activeId={-1}
          isFirst={!dataSource.loadend}
        ></CatalogList>
        <NoResult
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          dataSource={dataSource.dataList}
          image={<IconFont type="icon-layers" />}
          filters={_.omit(queryParams, ['sort_by'])}
          noFoundText={intl.formatMessage({
            id: 'noresult.catalog.nofound'
          })}
          title={intl.formatMessage({ id: 'noresult.catalog.title' })}
          subTitle={intl.formatMessage({ id: 'noresult.catalog.subTitle' })}
        ></NoResult>
      </ScrollerContext.Provider>
      <DelopyBuiltInModal
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={openDeployModal.source}
        width={openDeployModal.width}
        current={openDeployModal.current}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DelopyBuiltInModal>
    </PageBox>
  );
};

export default Catalog;
