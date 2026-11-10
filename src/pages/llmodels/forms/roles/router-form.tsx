import { LabelSelector } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Input } from 'antd';
import React from 'react';
import { OverrideGroupMap } from '../../config';
import { useFormContext } from '../../config/form-context';
import { PDMode } from '../../config/types';
import { routerCommandSource } from '../../utils/pd-router-command';
import BackendParametersList from '../backend-parameters-list';
import OverrideSection from './override-section';
import { reseedRoleInjection } from './reseed-injection';
import RoleBackend from './role-backend';
import RouterScheduling, { RouterResources } from './router-scheduling';
import SystemManaged, { flagLines } from './system-managed';

interface RouterFormProps {
  /** The router's index in `roles`. */
  index: number;
  /** The selected pd mode's catalog entry; its `router` block is what a managed router derives from. */
  mode?: PDMode;
}

/**
 * Router launch, parameters and placement. Catalog defaults are seeded only
 * when the command is empty; a user command owns every CLI flag.
 */
const RouterForm: React.FC<RouterFormProps> = ({ index, mode }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();

  const { flatBackendOptions = [] } = useFormContext();
  const roles = Form.useWatch('roles', { form, preserve: true });
  const role = roles?.[index] || form.getFieldValue(['roles', index]);
  const { command } = routerCommandSource(
    role,
    flatBackendOptions.find((item) => item.value === role?.backend)
  );
  // The selected backend's command owns its flags just like a role command.
  const router = command?.trim() ? undefined : mode?.router;

  // Untouched defaults are stripped at submit, so the worker renders current
  // placement values. Switching to a user command removes only those defaults.
  const injectedRouterParams = React.useMemo(
    () => [
      ...flagLines(router?.connection_args || []),
      // Only the ones with a declared default: a tunable with none has nothing
      // to show, and seeding a bare `--flag` would submit a valueless option
      // the router does not take.
      ...(router?.tunable_args || [])
        .filter((arg) => arg.default != null && arg.default !== '')
        .map((arg) => `${arg.flag} ${arg.default}`)
    ],
    [router]
  );

  // Same contract as the prefill/decode side, including the no-early-return:
  // a mode with no router args has to take the previous mode's rows back out.
  React.useEffect(() => {
    reseedRoleInjection(form, index, { params: injectedRouterParams });
  }, [injectedRouterParams, form, index]);

  return (
    <>
      {/* The role's identity has no visible control, so nothing would register
          it — and `onFinish` rebuilds its value from REGISTERED fields only,
          the same rule that makes `useWatch` need `preserve`. Without this the
          submitted role is an anonymous bag of overrides and the API refuses
          it. Same trick `kv-cache.tsx` uses to keep `mode` alive. */}
      <Form.Item name={['roles', index, 'name']} hidden>
        <Input />
      </Form.Item>
      {/* 🔴 No replica field. A router is structurally one — a second would
          split the prefix cache and give the group two addresses — so there
          was never a question here, only a disabled input showing «1» and a
          «?» explaining why it could not be changed. A control that cannot
          be operated is a control that has to be read past.

          Nothing needs to register it: `roleFormToPayload` writes
          `replicas: isRouter ? 1 : …` outright, `createDefaultRoles` seeds 1,
          and `RoleSpec.replicas` is `Field(default=1, ge=1)` server-side. The
          count was decided in three places already; the field was the only
          one that looked like a decision. */}
      <RoleBackend index={index} />

      <OverrideSection
        group={OverrideGroupMap.Parameters}
        index={index}
        alwaysOpen
        seedFromModel={false}
      >
        <SystemManaged
          groups={[
            {
              // 🔴 One list, exactly as a prefill or a decode gets. It used to
              // be three bands — connection flags padlocked, tunables as
              // typed controls with the catalog default as placeholder, and a
              // third for the user's own — which made the router the only
              // role whose parameters were not simply a list of parameters.
              //
              // Everything the recipe declares is seeded into that one list
              // now (see `injectedRouterParams`) and stripped again at submit
              // if untouched, so the defaults keep coming from the catalog
              // while every row stays editable. Appending is still how an
              // override works: repeated flags are last-wins in both shipped
              // routers, verified against the wheels.
              title: intl.formatMessage({
                id: 'models.form.roles.router.routeArgs'
              }),
              description: intl.formatMessage({
                id: 'models.form.roles.router.routeArgs.tips'
              }),
              footer: (
                <BackendParametersList
                  namePrefix={['roles', index]}
                  router={router ?? null}
                ></BackendParametersList>
              )
            },
            {
              title: intl.formatMessage({ id: 'models.form.env' }),
              description: intl.formatMessage({
                id: 'models.form.roles.managed.env.tips'
              }),
              footer: (
                <Form.Item name={['roles', index, 'env']}>
                  <LabelSelector
                    label={intl.formatMessage({ id: 'models.form.env' })}
                    btnText={intl.formatMessage({ id: 'common.button.vars' })}
                  ></LabelSelector>
                </Form.Item>
              )
            }
          ]}
        ></SystemManaged>
      </OverrideSection>

      {/* 🔴 Sizing and placement in ONE section, and the switch is over the
          placement half alone.
          
          They used to be two cards: «资源» always visible, and a «资源与调度»
          whose «自定义» branch rendered no children at all — a switch the user
          could click that had nothing behind it. Merging them is what makes
          the switch mean something: «系统托管» is «anywhere that fits, as near
          the group as possible», «自定义» is «and here is my constraint».

          `resources` is not one of the scheduling group's fields, so the
          switch does not touch CPU and memory — which is why they render in
          both branches, as a `prefix`. */}
      <OverrideSection
        group={OverrideGroupMap.Scheduling}
        index={index}
        alwaysOpen
        // Nothing to seed. The three scheduling fields are model-level ones a
        // PD deployment already cleared, and copying a GPU selector onto a
        // role that takes no GPU is the one thing this section must not do.
        seedFromModel={false}
        prefix={<RouterResources index={index}></RouterResources>}
        inheritContent={
          <div className="section-summary">
            {intl.formatMessage({ id: 'models.form.roles.router.locality' })}
          </div>
        }
      >
        <RouterScheduling index={index}></RouterScheduling>
      </OverrideSection>
    </>
  );
};

export default RouterForm;
