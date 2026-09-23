import { LabelSelector } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Input } from 'antd';
import React from 'react';
import { OverrideGroupMap } from '../../config';
import { PDMode } from '../../config/types';
import BackendParametersList from '../backend-parameters-list';
import OverrideSection from './override-section';
import { reseedRoleInjection } from './reseed-injection';
import RouterScheduling, { RouterResources } from './router-scheduling';
import SystemManaged, { flagLines } from './system-managed';

interface RouterFormProps {
  /** The router's index in `roles`. */
  index: number;
  /** The selected pd mode's catalog entry; its `router` block is what a managed router derives from. */
  mode?: PDMode;
}

/**
 * The router role.
 *
 * Different in kind from prefill and decode: its image, invocation, peer
 * addresses and health path all come from the mode catalog, so asking the user
 * to type them is asking them to restate what the system already knows. It is
 * therefore always managed by the system — there is no engine group here to
 * take it over with.
 *
 * What the catalog declares is still visible, and editable where it should be:
 * the **connection arguments** are ours, rendered from where the group landed,
 * and the **tunable arguments** are the user's to change. Both are seeded into
 * the one parameter list below, and a row left untouched is stripped again at
 * submit so the server goes on rendering it.
 */
const RouterForm: React.FC<RouterFormProps> = ({ index, mode }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();

  // 🔴 `systemAssembled` is gone, and so is the rule it mirrored
  // (`is_managed_router`: the platform keeps assembling the router's
  // invocation until the role carries BOTH an image and a command of its
  // own). With the engine group removed from every role, the payload nulls
  // `image_name` and `run_command` unconditionally — so that rule can only
  // ever answer "managed", and a branch on it is a branch with one side.
  const router = mode?.router;
  const connectionArgs = router?.connection_args || [];
  const tunableArgs = router?.tunable_args || [];

  // 🔴 The connection flags are seeded into the role's own parameter list,
  // the same way a prefill's `--kv-transfer-config` is. They used to be a
  // padlocked band the user could read and nothing else, and admission
  // refused them outright — which made the router the one role whose injected
  // parameters could not be touched.
  //
  // Safe because they are appended AFTER the declared command and every one
  // of them is last-wins, so setting one overrides it. The peer flags are the
  // exception and are NOT seeded: `--prefill` / `--decode` are
  // `action="append"`, so a second one adds a phantom peer rather than
  // replacing ours — admission still refuses those, and they are not in
  // `connection_args` to begin with (they live in `peers`).
  //
  // Seeded, not frozen: a row left untouched is stripped again at submit, so
  // `{{worker_ip}}` and `{{ports.prometheus}}` go on being rendered from
  // where the router actually lands.
  const injectedRouterParams = React.useMemo(
    () => [
      ...flagLines(connectionArgs),
      // Only the ones with a declared default: a tunable with none has nothing
      // to show, and seeding a bare `--flag` would submit a valueless option
      // the router does not take.
      ...tunableArgs
        .filter((arg) => arg.default != null && arg.default !== '')
        .map((arg) => `${arg.flag} ${arg.default}`)
    ],
    [connectionArgs, tunableArgs]
  );

  // Same contract as the prefill/decode side, including the no-early-return:
  // a mode with no router args has to take the previous mode's rows back out.
  React.useEffect(() => {
    reseedRoleInjection(form, index, { params: injectedRouterParams });
  }, [injectedRouterParams, form, index]);

  // 🔴 A mount effect used to seed `backend` / `backend_version` / `image_name`
  // from the Model, so that the engine group's required Backend field did not
  // open blank. It went with the group: there is no field left to fill, and
  // writing those three into the role now would put values into a store the
  // payload nulls anyway — an override that exists nowhere on screen.

  // 🔴 `handleModeChange` / `modeSwitch` / `managedDisabledReason` lived here,
  // driving the engine group's managed-custom switch. All three went with it,
  // and then the group itself did.

  // 🔴 `connectionBand` / `routeArgsGroup` / `managedArgs` lived here, building
  // the three-band read-only view of the route arguments for the collapsed
  // «系统托管» branch. Both the bands and that branch are gone: the arguments
  // are one editable list now, and there is no collapsed state left to
  // summarise.

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
      {/* 🔴 No «引擎与镜像» section here either, matching prefill and decode.
          Where the router's image and command come from is decided by the
          mode, and neither branch needs a field:

          - a built-in recipe declares `router.protocol != user_provided`, so
            `is_managed_router` is true and `apply_managed_router` renders the
            image and the entrypoint from the catalog's `router` block;
          - `custom` declares `user_provided`, so `is_managed_router` is FALSE
            whatever the role carries, and the worker reads the image and
            command off the role spec — which `roleFormToPayload` now nulls,
            so `role_effective_model` projects the MODEL's `image_name` and
            `run_command` onto the router.

          The second branch is the one this section used to serve, and the
          Model's two fields serve it just as well: a `custom` group is on a
          user-supplied image already, and putting the router binary in it —
          with an entrypoint that dispatches on the role — is the same work as
          typing the image name here, minus a second place to keep it in sync.
       */}

      {/* Shown on BOTH branches, and so is the platform half inside it. A
          hand-written router still takes arguments and still needs environment
          variables — Ascend's is the standing example, where the router cannot
          start without `TORCH_DEVICE_BACKEND_AUTOLOAD=0` (V11) — and the
          platform keeps injecting its own until the role carries both an image
          and a command, which is what `systemAssembled` reads. */}
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
