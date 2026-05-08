import { history, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React, { useEffect } from 'react';
import { PageContainerInner } from '../pages/_components/page-box';

// On a 403, auto-redirect to root so context changes (e.g. an org
// switch into a context that can't see the current route) don't
// dead-end the user on a permission page. The 404 path stays as a
// classic Result with a Back button — those are usually genuine
// "wrong URL" landings the user should see and acknowledge.
const Exception: React.FC<{
  children: React.ReactNode;
  route?: any;
  notFound?: React.ReactNode;
  noAccessible?: React.ReactNode;
  unAccessible?: React.ReactNode;
  noFound?: React.ReactNode;
}> = (props) => {
  const intl = useIntl();
  const unaccessible = !!props.route?.unaccessible;
  const customNoAccessible = props.unAccessible || props.noAccessible;
  const willAutoRedirect = unaccessible && !customNoAccessible;

  useEffect(() => {
    if (willAutoRedirect) {
      // `replace` instead of `push` so the user's Back button doesn't
      // bounce them back into the unauthorized page (which would just
      // redirect forward again).
      history.replace('/');
    }
  }, [willAutoRedirect]);

  // Render `null` during the auto-redirect path so the default 403
  // Result doesn't flash for one frame before useEffect fires.
  if (willAutoRedirect) {
    return null;
  }

  return (
    (!props.route && (props.noFound || props.notFound)) ||
    // render custom 403
    (unaccessible && customNoAccessible) ||
    // render default 404
    (!props.route && (
      <PageContainerInner>
        <Result
          status="404"
          title="404"
          subTitle={intl.formatMessage({ id: 'common.permission.404' })}
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
