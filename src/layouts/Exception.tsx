// @ts-nocheck

import { history, useIntl, type IRoute } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

const Exception: React.FC<{
  children: React.ReactNode;
  route?: IRoute;
  notFound?: React.ReactNode;
  noAccessible?: React.ReactNode;
  unAccessible?: React.ReactNode;
  noFound?: React.ReactNode;
}> = (props) => {
  const intl = useIntl();
  // render custom 404
  console.log('exception====', props.route);
  return (
    (!props.route && (props.noFound || props.notFound)) ||
    // render custom 403
    (props.route?.unaccessible && (props.unAccessible || props.noAccessible)) ||
    // render default exception
    ((!props.route || props.route?.unaccessible) && (
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
    )) ||
    // normal render
    props.children
  );
};

export default Exception;
