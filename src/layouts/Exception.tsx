import { history, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import { PageContainerInner } from '../pages/_components/page-box';

const Exception: React.FC<{
  children: React.ReactNode;
  route?: any;
  notFound?: React.ReactNode;
  noAccessible?: React.ReactNode;
  unAccessible?: React.ReactNode;
  noFound?: React.ReactNode;
}> = (props) => {
  const intl = useIntl();
  // render custom 404
  console.log('exception====', props);
  return (
    (!props.route && (props.noFound || props.notFound)) ||
    // render custom 403
    (props.route?.unaccessible && (props.unAccessible || props.noAccessible)) ||
    // render default exception
    ((!props.route || props.route?.unaccessible) && (
      <PageContainerInner>
        <Result
          status={props.route ? '403' : '404'}
          title={props.route ? '403' : '404'}
          subTitle={
            props.route
              ? intl.formatMessage({ id: 'common.permission.403' })
              : intl.formatMessage({ id: 'common.permission.404' })
          }
          extra={
            <Button type="primary" onClick={() => history.push('/')}>
              {intl.formatMessage({ id: 'common.button.back' })}
            </Button>
          }
        />
      </PageContainerInner>
    )) ||
    // normal render
    props.children
  );
};

export default Exception;
