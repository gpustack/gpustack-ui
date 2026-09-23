import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { App } from 'antd';
import { restartModel } from '../apis';
import { modelReplicaCounts } from '../config';
import { ListItem } from '../config/types';

/**
 * "Restart this deployment", as an action on a model row.
 *
 * Three outcomes and three different sentences, only one of which is a failure.
 *
 * 🔴 `restarted: false` used to mean "already on the current spec, nothing to
 * do" — the endpoint short-circuited on a converged group. It no longer does,
 * because only a group's members carry a `spec_digest`, so that check made the
 * same menu entry rebuild a role-less deployment while doing nothing to a PD
 * group. Now the only way back with `restarted: false` is a deployment with no
 * instances at all, which is why the fallback wording says exactly that.
 *
 * A 409 is the other non-failure: a restart is mid-flight and a second
 * teardown would delete the replacements the first one just created, so it is
 * a "wait", not a fault.
 */
const useRestartModel = (options?: { onSuccess?: (row: ListItem) => void }) => {
  const intl = useIntl();
  // Not the static `Modal` / `message`: those render in their own detached
  // root, outside the app's ConfigProvider, so they ignore the dark algorithm
  // and the locale. `<App>` only reaches the components that ASK for it here —
  // a module-level `import { message } from 'antd'` is not bridged by it.
  //
  // 🔴 For toasts that is not cosmetic. `global.less` restyles them with
  // `color: var(--color-status-error-text)` — the project's own variable,
  // declared on `html[data-theme='realDark']` and therefore inherited even by a
  // detached container — over `background-color: var(--ant-color-error-bg)`,
  // antd's cssVar, which is scoped to the ConfigProvider container the static
  // API never enters. A static toast in dark mode therefore paints dark text on
  // the LIGHT background: #ff7875 on #fff2f0 is 2.3:1, and the success pair
  // 2.0:1, against the 4.5:1 that the measurements in `global.less` were taken
  // to satisfy.
  const { modal, message } = App.useApp();

  const handleRestartModel = useMemoizedFn(async (row: ListItem) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      modal.confirm({
        title: intl.formatMessage({ id: 'models.restart' }),
        content: intl.formatMessage(
          { id: 'models.restart.confirm' },
          // The declared size of the group, router included — the same sum the
          // list's replica column shows, so the confirmation and the row the
          // user is looking at cannot disagree. A plain model degenerates to
          // `replicas`.
          { name: row.name, total: modelReplicaCounts(row).total }
        ),
        okText: intl.formatMessage({ id: 'models.restart' }),
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
    if (!confirmed) {
      return;
    }

    try {
      const result = await restartModel(row.id as number);
      if (result?.restarted) {
        message.success(intl.formatMessage({ id: 'models.restart.done' }));
        options?.onSuccess?.(row);
        return;
      }
      // The server's own sentence when it sent one: it separates "already on
      // this configuration" from "nothing is running", which `restarted:
      // false` alone cannot express.
      message.info(
        result?.message || intl.formatMessage({ id: 'models.restart.uptodate' })
      );
    } catch (error: any) {
      // `restartModel` opts out of the global handler, so every branch below
      // has to end in a message — including the ones we have no wording for.
      if (error?.response?.status === 409) {
        message.warning(
          intl.formatMessage({ id: 'models.restart.inprogress' })
        );
        return;
      }
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          intl.formatMessage({ id: 'models.restart.failed' })
      );
    }
  });

  return { handleRestartModel };
};

export default useRestartModel;
