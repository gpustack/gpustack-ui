import {
  InputNumber,
  LabelSelector,
  LabelSelectorProvider,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { ScheduleValueMap, WORKER_NAME_LABEL } from '../../config';
import { useFormContext } from '../../config/form-context';
import { isManualWorkerSelector } from './transform';

const GIB = 1024 ** 3;

const useStyles = createStyles(({ css }) => ({
  resources: css`
    margin-bottom: 12px;
  `,
  nested: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    padding: 10px 12px 12px;
    .nested-title {
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--ant-color-text-secondary);
    }
  `
}));

interface RouterSchedulingProps {
  /** The router's index in `roles`. */
  index: number;
}

/**
 * CPU and memory for the router's container.
 *
 * Rendered in BOTH branches of the section's switch, which is why it is a
 * `prefix` rather than a child: a router is sized in CPU and RAM whether or
 * not anyone constrains where it goes, and `resources` is not one of the
 * scheduling group's fields, so flipping the switch does not touch it.
 *
 * Empty, not seeded. Left empty the server applies `ROUTER_DEFAULT_CPU` /
 * `ROUTER_DEFAULT_MEMORY`; submitting those numbers explicitly would freeze
 * today's defaults into every deployment, so a later change to the floor
 * would not reach them. An `initialValue` is therefore wrong however much
 * nicer the filled-in field looks.
 *
 * 🔴 **Seeded with the server's floor, and stripped again on submit.** Both
 * halves live in `transform.ts` — `rolesSpecToForm` fills the fields,
 * `stripDefaultResources` drops a value that came back still equal to the
 * floor — because a `useEffect` here raced the form's own `initialValues` and
 * lost: the fields rendered empty. Untouched therefore still means «whatever the server's
 * default is», which is the only reading under which a later change to
 * `ROUTER_DEFAULT_CPU` reaches existing groups.
 *
 * Not a `placeholder`, which would have been the obvious way to show a
 * default without it being a value: core-ui's text `Input` gates the
 * placeholder on the floating label (`placeholder: focused || !label ? ph :
 * ''`) so the two never share a line, but `InputNumber` passes it straight
 * through and the two then render on top of each other. Measured — with the
 * field empty and unfocused, the label box and the input's text box start at
 * the same y.
 */
export const RouterResources: React.FC<RouterSchedulingProps> = ({ index }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  return (
    <div className={styles.resources}>
      <Flex gap={12}>
        <Form.Item
          name={['roles', index, 'resources', 'cpu']}
          style={{ flex: 1, marginBottom: 0 }}
        >
          <InputNumber
            min={0.1}
            step={1}
            style={{ width: '100%' }}
            label={intl.formatMessage({
              id: 'models.form.roles.resources.cpu'
            })}
          ></InputNumber>
        </Form.Item>
        <Form.Item
          name={['roles', index, 'resources', 'memory']}
          style={{ flex: 1, marginBottom: 0 }}
          // Bytes on the wire, GiB in the field. The API keeps bytes so it
          // matches every other memory figure in the schema; a user typing
          // "2147483648" would be the alternative.
          getValueProps={(value) => ({
            value: typeof value === 'number' ? value / GIB : value
          })}
          normalize={(value) =>
            typeof value === 'number' ? Math.round(value * GIB) : value
          }
        >
          <InputNumber
            min={0.5}
            step={1}
            style={{ width: '100%' }}
            label={intl.formatMessage({
              id: 'models.form.roles.resources.memory'
            })}
          ></InputNumber>
        </Form.Item>
      </Flex>
    </div>
  );
};

/**
 * Where the router runs, for an operator who wants a say.
 *
 * Not `ScheduleTypeForm`: everything that form offers under «手动» — the GPU
 * cascader, the vGPU slice picker, «每副本卡数» — names cards, and this role
 * takes none. What is left is the host, so that is all this asks.
 *
 * 🔴 **The mode is derived from the stored value, not stored beside it.**
 * `scheduleType` is UI-only and never reaches the API, so on reopening an edit
 * drawer it has to be recovered from `worker_selector` — and both modes write
 * that one field. The rule: exactly one pair, keyed `worker-name`, is «手动».
 * A selector the user typed in «自动» that happens to be that one pair reopens
 * as «手动», showing the same machine; the label differs, the placement does
 * not. Anything else — two pairs, or one pair keyed something else — is
 * «自动».
 *
 * Switching modes CLEARS the field rather than translating it, the same
 * gesture `ScheduleTypeForm` makes on `gpu_selector`. Carrying a value across
 * would silently reinterpret it: «这台机器» becoming «任何带这个标签的机器»,
 * or a `zone=a` constraint becoming a pin to one host.
 */
const RouterScheduling: React.FC<RouterSchedulingProps> = ({ index }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { workerLabelOptions } = useFormContext();
  const { getRuleMessage } = useAppUtils();
  const form = Form.useFormInstance();
  const path = (...field: (string | number)[]) => ['roles', index, ...field];

  // 🔴 `preserve`, because in «手动» NOTHING registers `worker_selector` — the
  // only Form.Item in that branch is the display shim below, and the map is
  // written by hand. A plain `useWatch` reads `getFieldsValue()`, which omits
  // unregistered fields, so an edit drawer opened on a hand-pinned router read
  // its own stored selector as empty and rendered a blank picker over a
  // perfectly good value. `preserve` reads `getFieldsValue(true)` instead.
  const selector = Form.useWatch(path('worker_selector'), {
    form,
    preserve: true
  });
  const stored = Form.useWatch(path('scheduleType'), form);

  const derivedManual = isManualWorkerSelector(selector);
  const mode =
    stored ?? (derivedManual ? ScheduleValueMap.Manual : ScheduleValueMap.Auto);
  const manual = mode === ScheduleValueMap.Manual;

  // Every worker's name, taken off the label options the form already
  // fetched. Deliberately from the labels rather than from `gpuOptions`: that
  // one is keyed by GPU, so a worker with no cards — a perfectly good host for
  // a proxy — would not be in it.
  const workerOptions = (
    workerLabelOptions.find((option) => option.value === WORKER_NAME_LABEL)
      ?.children || []
  ).map((child: any) => ({ label: child.label, value: child.value }));

  const handleModeChange = () => {
    form.setFieldValue(path('worker_selector'), null);
    form.setFieldValue(path('scheduleWorker'), undefined);
  };

  const handleWorkerChange = (value?: string) => {
    form.setFieldValue(path('scheduleWorker'), value);
    form.setFieldValue(
      path('worker_selector'),
      value ? { [WORKER_NAME_LABEL]: value } : null
    );
  };

  return (
    <>
      <Form.Item
        name={path('scheduleType')}
        getValueProps={() => ({ value: mode })}
      >
        <SealSelect
          onChange={handleModeChange}
          label={intl.formatMessage({ id: 'models.form.scheduletype' })}
          description={intl.formatMessage({
            id: 'models.form.roles.router.scheduletype.tips'
          })}
          options={[
            {
              label: intl.formatMessage({
                id: 'models.form.scheduletype.auto'
              }),
              value: ScheduleValueMap.Auto
            },
            {
              label: intl.formatMessage({
                id: 'models.form.scheduletype.manual'
              }),
              value: ScheduleValueMap.Manual
            }
          ]}
        ></SealSelect>
      </Form.Item>
      {manual ? (
        <div className={styles.nested}>
          <div className="nested-title">
            {intl.formatMessage({
              id: 'models.form.roles.router.workerAllocation'
            })}
          </div>
          {/* Not a `Form.Item` on `worker_selector` itself: the control's value
              is one string and the field's is a map, and a `normalize` pair
              would have to survive the mode switch clearing it. Written by
              hand instead, so the one shape the field may hold in this mode is
              written in one place. */}
          <Form.Item
            name={path('scheduleWorker')}
            getValueProps={() => ({
              value: selector?.[WORKER_NAME_LABEL]
            })}
            // 🔴 Validates `worker_selector`, not this field. `scheduleWorker`
            // is a display shim — the control writes the MAP, and this field's
            // own value exists only so the item has somewhere to hang an
            // error. On reopening an edit drawer the shim is undefined while
            // the selector holds a worker, so `required: true` would fail a
            // form that is perfectly valid.
            //
            // 🔴 Read through `getFieldValue`, NOT through the watched
            // `selector` above, and that distinction is the whole of a bug
            // this carried: picking a worker rendered its name and «请选择»
            // at the same time, and the field stayed red with a value in it.
            //
            // rc-field-form wraps the validate trigger AROUND the value
            // trigger, so the order on one change is: store the value, run
            // this element's own `onChange` — which is where
            // `handleWorkerChange` writes the map — and only then dispatch
            // validation. So the store already holds the new selector when a
            // validator runs, while `useWatch`'s copy is still a render
            // behind and empty. The store is what was just written; the watch
            // is for rendering.
            rules={[
              {
                validator: () =>
                  form.getFieldValue(path('worker_selector'))?.[
                    WORKER_NAME_LABEL
                  ]
                    ? Promise.resolve()
                    : Promise.reject(
                        getRuleMessage(
                          'select',
                          'models.form.roles.router.workerSelect'
                        )
                      )
              }
            ]}
          >
            {/* 🔴 No `allowClear`, for two reasons that point the same way.
                It has nothing to clear TO: in «手动» a worker is required, so
                the button's only outcome is the error state below — the way
                to stop naming a machine is to switch back to «自动». And it
                renders wrong here: the clear button lands on top of the
                select's own suffix icon (both 12×12, 3px apart, measured),
                so hovering shows a ✕ and a chevron drawn over each other. */}
            <SealSelect
              showSearch
              onChange={handleWorkerChange}
              label={intl.formatMessage({
                id: 'models.form.roles.router.workerSelect'
              })}
              options={workerOptions}
            ></SealSelect>
          </Form.Item>
        </div>
      ) : (
        <LabelSelectorProvider value={{ options: workerLabelOptions }}>
          <Form.Item
            name={path('worker_selector')}
            style={{ marginBottom: 12 }}
          >
            <LabelSelector
              isAutoComplete
              label={intl.formatMessage({
                id: 'resources.form.workerSelector'
              })}
              description={intl.formatMessage({
                id: 'models.form.roles.router.workerSelector.tips'
              })}
            ></LabelSelector>
          </Form.Item>
        </LabelSelectorProvider>
      )}
    </>
  );
};

export default RouterScheduling;
