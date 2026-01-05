import { clusterSessionAtom } from '@/atoms/clusters';
import IconFont from '@/components/icon-font';
import NoResult from '@/pages/_components/no-result';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useMemo } from 'react';

/**Title: Generally, this is from the activation page.
 * DefaultContent: This content from the activate page, for example, the activate page is Deployments page,
 * then the defaultContent is for deployment.
 * @param props
 * @returns
 */
const useNoResourceResult = (props: {
  iconType: string;
  loading?: boolean;
  loadend?: boolean;
  dataSource?: any[];
  queryParams?: Record<string, any>;
  title: React.ReactNode;
  noClusters?: boolean;
  noWorkers?: boolean;
  subTitle?: React.ReactNode;
  defaultContent?: {
    subTitle: string;
    noFoundText: string;
    buttonText: string;
    onClick: () => void;
  };
}) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const {
    noClusters,
    noWorkers,
    defaultContent,
    loading,
    loadend,
    dataSource,
    queryParams,
    iconType,
    title,
    subTitle
  } = props;
  const [, setClusterSession] = useAtom(clusterSessionAtom);

  const handleClick = useMemoizedFn(() => {
    if (noClusters) {
      setClusterSession({
        firstAddWorker: false,
        firstAddCluster: true
      });

      navigate(`/cluster-management/clusters/list`);
      return;
    }

    if (noWorkers) {
      setClusterSession({
        firstAddWorker: true,
        firstAddCluster: false
      });
      navigate(`/cluster-management/clusters/list`);
    }
  });

  const statusContent = useMemo(() => {
    if (noClusters) {
      return {
        subTitle:
          subTitle || intl.formatMessage({ id: 'noresult.resources.cluster' }),
        noFoundText: defaultContent?.noFoundText || '',
        buttonText: intl.formatMessage({
          id: 'noresult.resources.gotocluster'
        }),
        onClick: handleClick
      };
    }

    if (noWorkers) {
      return {
        subTitle:
          subTitle || intl.formatMessage({ id: 'noresult.resources.worker' }),
        noFoundText: defaultContent?.noFoundText || '',
        buttonText: intl.formatMessage({ id: 'noresult.resources.gotoworker' }),
        onClick: handleClick
      };
    }

    return {
      ...defaultContent
    };
  }, [noClusters, noWorkers, intl]);

  const noResourceResult = (
    <NoResult
      loading={loading}
      loadend={loadend}
      dataSource={dataSource}
      image={<IconFont type={iconType} />}
      filters={_.omit(queryParams, ['sort_by'])}
      noFoundText={statusContent.noFoundText}
      title={title}
      subTitle={statusContent.subTitle}
      onClick={statusContent.onClick}
      buttonText={statusContent.buttonText}
    ></NoResult>
  );
  return {
    noResourceResult,
    handleCreate: handleClick
  };
};

export default useNoResourceResult;
