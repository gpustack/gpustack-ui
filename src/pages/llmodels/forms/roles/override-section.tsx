import { AutoTooltip, LabelInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Segmented, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import React from 'react';
import {
  OverrideGroupFields,
  OverrideGroupLabelMap,
  OverrideGroupTipsMap
} from '../../config';
import { isGroupOverridden } from './transform';

// A role's sections reuse the bordered card the Scheduled Scaling and GPU
// Allocation sections already use, with the switch in the title row.
const useStyles = createStyles(({ css }) => ({
  sectionCard: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    /* 🔴 The card owns its bottom inset. It used to be 0 and rely on whatever
       it contained to supply one, which produced three different gaps in one
       panel: 25px under a section ending in a Form.Item (its 24px margin),
       and 1px under the two ending in something with no margin of its own —
       SystemManaged, once the editable lists moved inside its groups, and the
       engine fields. Zeroing the last child's margin and paying for the gap
       here makes every card end the same way, whatever it contains. */
    padding: 12px;
    margin-bottom: 12px;
    .section-title {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--ant-color-text);
    }
    /* the collapsed group's read-only line */
    .section-summary {
      padding-bottom: 12px;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
    /* ⚠️ Last in the block on purpose, and !important on purpose.
       Source order: this has the same specificity as the .section-title rule
       above (one class plus one simple selector), so written any earlier a
       card whose last child IS the title — an empty section — kept the
       title's 12px and ended 25px deep next to neighbours ending at 13.
       !important: several of the things that land here carry an inline
       margin of their own (GatherLocality's field, the role tabs, the KV
       cache row), which no stylesheet rule can outrank. The card decides its
       own bottom inset; what it contains does not get a vote. */
    > *:last-child {
      margin-bottom: 0 !important;
    }
  `
}));

// The two states of an override switch. Strings rather than the boolean the
// store holds: a Segmented needs a `string | number` value, and the stored
// shape is fixed by `RoleFormItem.overrides`.
const OverrideModeMap = {
  Inherit: 'inherit',
  Custom: 'custom'
};

// UI-only fields a group has to carry alongside its payload fields. The
// scheduling group's two say which GPU source the section is editing; without
// copying them a role switched to custom would open on "Auto" while holding
// the GPUs it just inherited. The roles transform strips them before submit.
const GroupUIFields: Record<string, string[]> = {
  // `scheduleWorker` is the router's: a display shim for the one worker its
  // manual branch pins to, whose real home is `worker_selector`. Listed here
  // for the same reason the other two are — left behind, it reopens the
  // section showing a machine the section no longer constrains.
  scheduling: ['scheduleType', 'manualGpuMode', 'scheduleWorker']
};

// Flatten a value to the strings worth showing in a one-line summary. Objects
// keep their keys (`FOO=bar` reads as an env var); nested containers drop
// theirs, since the key of a list adds nothing the values do not say.
const flattenLeaves = (value: any): string[] => {
  if (value == null || value === '') {
    return [];
  }
  if (_.isArray(value)) {
    return _.flatMap(value, flattenLeaves);
  }
  if (_.isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, item]) => {
      const leaves = flattenLeaves(item);
      if (!leaves.length) {
        return [];
      }
      return _.isObject(item) ? leaves : [`${key}=${leaves[0]}`];
    });
  }
  return [String(value)];
};

// What identifies an inherited value, per field. The two GPU selectors get
// their own rule because their shape is known and most of it is noise: a
// cascader pair is [worker, gpu] and only the gpu names the choice, and a
// gpu_type_selector is identified by its type rather than by its percentages.
const summarizeField = (field: string, value: any): string => {
  if (field === 'gpu_selector') {
    return _.map(value?.gpu_ids || [], (id: string | string[]) =>
      _.isArray(id) ? _.last(id) : id
    ).join(', ');
  }
  if (field === 'gpu_type_selector') {
    return value?.type || '';
  }
  return flattenLeaves(value).join(' ');
};

interface RoleSectionProps {
  /** Message id for the section's title. */
  label: string;
  /** The title row's right-hand control (an override switch, usually). */
  extra?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * The bordered card a role's fields sit in. Separate from the override switch
 * because two of the sections have no switch: the per-role KV cache does not
 * inherit at all, and the router's is a managed/custom choice rather than an
 * override.
 */
export const RoleSection: React.FC<RoleSectionProps> = ({
  label,
  extra,
  description,
  children
}) => {
  const { styles } = useStyles();
  return (
    <div className={styles.sectionCard}>
      <Flex className="section-title" align="center" justify="space-between">
        <LabelInfo label={label} description={description}></LabelInfo>
        {extra}
      </Flex>
      {children}
    </div>
  );
};

interface OverrideSectionProps {
  /** `OverrideGroupMap` value: which fields this section owns. */
  group: string;
  /** The role's index in `roles`, i.e. the Form path this section writes to. */
  index: number;
  /** Reason the group cannot be customized; disables the switch when set. */
  disabledReason?: string;
  /**
   * Replaces the derived "inherited: …" line while the group is collapsed.
   *
   * For the router, whose parameters are inherited from the mode catalog
   * rather than from the Model: summarizing its Model-level fields there would
   * name values it does not run.
   */
  inheritContent?: React.ReactNode;
  /**
   * Whether switching to custom seeds the group from the Model's values.
   *
   * True everywhere it is an override of something. False for the router's
   * parameters, where custom means *appending* to a catalog invocation — and
   * seeding would copy the group's engine parameters onto a `vllm-router`
   * command line that has no such flags, which is the bug the server drops
   * inherited parameters to avoid.
   */
  seedFromModel?: boolean;
  /**
   * Rendered above the group in **both** branches.
   *
   * For what the platform writes into the role regardless of the switch: a
   * prefill's KV connector configuration is injected whether or not the user
   * also customized its parameters, so it belongs to neither branch and
   * showing it in only one would claim the switch controls it.
   */
  prefix?: React.ReactNode;
  /**
   * Drop the managed/custom switch and always show the editable group.
   *
   * 🔴 For the groups a role-less deployment has no switch for either —
   * engine, parameters, environment. Two mental models for the same three
   * fields was the cost of the switch, and it bought a distinction the reader
   * mostly did not want to make: they opened the drawer to see what the role
   * runs, and got a collapsed line telling them to click again.
   *
   * Inheritance is NOT dropped with it. The group opens seeded from the
   * model's values, and `rolesFormToPayload` writes `null` for any group left
   * identical to them — so an untouched role still follows the model, exactly
   * as it did on the «managed» side of the switch. Editing anything is what
   * makes the override real, which is the gesture people expected the switch
   * to be doing anyway.
   *
   * Used for `parameters` AND `scheduling` — `role-form` opens both this way.
   * The note that used to sit here said scheduling was excluded, on the
   * argument that «managed» there means "the scheduler picks" rather than
   * "same as the model". That distinction is real but it is not this prop's:
   * an always-open scheduling group still seeds from the model and is still
   * demoted back to inherit when nothing was changed, which is exactly what
   * makes "the scheduler picks" the outcome of leaving it alone.
   */
  alwaysOpen?: boolean;
  children?: React.ReactNode;
}

/**
 * One override group of one role.
 *
 * "Same as model" is not "nothing here": the group collapses to a read-only
 * line naming what it is inheriting, so the user can see the effective
 * configuration without opening every group. Turning the switch on seeds the
 * group from those same model-level values (a custom group that opens empty
 * would make the user retype what they already had); turning it off nulls
 * exactly the fields the group owns, which is the wire's word for inherit.
 */
const OverrideSection: React.FC<OverrideSectionProps> = ({
  group,
  index,
  disabledReason,
  inheritContent,
  seedFromModel = true,
  prefix,
  alwaysOpen = false,
  children
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const fields = OverrideGroupFields[group] || [];
  const uiFields = GroupUIFields[group] || [];
  const overridden = Form.useWatch(['roles', index, 'overrides', group], form);

  // Seed once, on the way in. `handleModeChange` did this when the user flipped
  // the switch; with no switch there is no gesture to hang it on, so it happens
  // when the section first mounts holding an inherited group. Without it the
  // list opens empty and reads as "this role runs nothing", which is the one
  // thing it must not say.
  //
  // `useEffect` with an empty dep list rather than a watch: this is a one-time
  // initialisation of form state, not a reaction to it, and re-running it on
  // every model-level keystroke would overwrite what the user just typed here.
  React.useEffect(() => {
    if (!alwaysOpen || disabledReason) {
      return;
    }
    /**
     * 🔴 The DATA decides, and it is read SYNCHRONOUSLY. Two separate reasons,
     * and the guard needs both.
     *
     * This asked `overridden`, the `useWatch` above. `useWatch` holds
     * `useState()` with no initial value and fills it from a *later* effect
     * (rc-field-form's own), so on the mount this effect runs in it is always
     * `undefined` — whatever the store holds. Every role therefore took the
     * seeding branch, including one opened from an existing deployment with
     * its own stored parameters, and `setFieldValue` wrote the MODEL's values
     * over them. Under PD the model's are empty by then, because
     * `clearModelParams` blanks them the moment the group is enabled, so what
     * landed on the role was `[]` and `{}`.
     *
     * Reported as: added parameters and env to prefill, deployed, reopened —
     * the injected rows were back (`role-form` re-seeds those from the mode
     * catalog) and everything hand-typed was gone. Same shape as the bug
     * `roleFormToPayload` documents, from the other end of the round trip: a
     * UI-only boolean asked about submit semantics, and answered stale.
     *
     * `isGroupOverridden` is that transform's own predicate, shared rather
     * than restated. A role holding a value is a role that has already been
     * configured, and seeding over it is never right — however it got here.
     */
    const stored = form.getFieldValue(['roles', index]) || {};
    if (isGroupOverridden(stored, group)) {
      form.setFieldValue(['roles', index, 'overrides', group], true);
      return;
    }
    if (seedFromModel) {
      [...fields, ...uiFields].forEach((field) => {
        form.setFieldValue(
          ['roles', index, field],
          _.cloneDeep(form.getFieldValue(field))
        );
      });
    }
    form.setFieldValue(['roles', index, 'overrides', group], true);
  }, []);

  const handleModeChange = (value: string | number) => {
    if (value === OverrideModeMap.Custom) {
      if (!seedFromModel) {
        return;
      }
      // Start from what the group was inheriting, so "custom" is an edit of
      // the effective configuration rather than a blank form.
      [...fields, ...uiFields].forEach((field) => {
        form.setFieldValue(
          ['roles', index, field],
          _.cloneDeep(form.getFieldValue(field))
        );
      });
      return;
    }
    // Null, not delete: null is what the backend reads as "inherit", and it
    // keeps the form's shape and the payload's shape the same.
    fields.forEach((field) => {
      form.setFieldValue(['roles', index, field], null);
    });
    uiFields.forEach((field) => {
      form.setFieldValue(['roles', index, field], undefined);
    });
  };

  const segmented = (
    <Form.Item
      noStyle
      name={['roles', index, 'overrides', group]}
      getValueProps={(value) => ({
        value: value ? OverrideModeMap.Custom : OverrideModeMap.Inherit
      })}
      normalize={(value) => value === OverrideModeMap.Custom}
    >
      <Segmented
        size="middle"
        type="rounded"
        style={{ fontSize: 12 }}
        disabled={!!disabledReason}
        onChange={handleModeChange}
        options={[
          {
            // 🔴 «系统托管», not «与模型相同». The label was describing where
            // the value comes from, and for two of the four groups that was
            // not even true: a role's parameters carry the platform's own
            // injection on top of the model's, and its placement is decided by
            // the scheduler rather than copied from anywhere. What the two
            // options actually differ on is who owns the group — which is also
            // the question the padlocks below answer.
            label: intl.formatMessage({ id: 'models.form.roles.managed' }),
            value: OverrideModeMap.Inherit
          },
          {
            label: intl.formatMessage({ id: 'models.form.roles.override' }),
            value: OverrideModeMap.Custom
          }
        ]}
      />
    </Form.Item>
  );

  // A custom group that ends up with nothing in it is stored as inherit: `null`
  // is the wire's only word for "no value", and `overrides` is UI-only and
  // stripped before submit — so the group would come back as Inherit next time
  // the drawer opens, having silently dropped the choice. Said here, where the
  // choice is made, rather than discovered on the next edit.
  const emptyOverride =
    !!overridden &&
    !disabledReason &&
    fields.every((field) => {
      const value = form.getFieldValue(['roles', index, field]);
      return (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && !value.length) ||
        value === ''
      );
    });

  return (
    <RoleSection
      label={intl.formatMessage({ id: OverrideGroupLabelMap[group] })}
      // What «系统托管» means for THIS group. The word is the same on all four
      // switches but the referent is not — one inherits the model's engine, one
      // adds the platform's own injection on top of it, one hands the choice to
      // the scheduler — and a label that reads identically everywhere has to
      // say somewhere which of those it is.
      description={
        OverrideGroupTipsMap[group]
          ? intl.formatMessage({ id: OverrideGroupTipsMap[group] })
          : undefined
      }
      extra={
        alwaysOpen ? undefined : disabledReason ? (
          <Tooltip title={disabledReason}>{segmented}</Tooltip>
        ) : (
          segmented
        )
      }
    >
      {prefix}
      {alwaysOpen || overridden ? (
        <>
          {emptyOverride && (
            <div className="note">
              {intl.formatMessage({ id: 'models.form.roles.override.empty' })}
            </div>
          )}
          {children}
        </>
      ) : inheritContent !== undefined ? (
        inheritContent
      ) : (
        // `shouldUpdate` rather than a watch per field: the summary reads
        // several model-level fields and only exists while collapsed, so
        // scoping the re-render to this one line is cheaper than subscribing
        // the whole section to the store.
        <Form.Item noStyle shouldUpdate>
          {(formInstance) => {
            const summary = fields
              .map((field) =>
                summarizeField(field, formInstance.getFieldValue(field))
              )
              .filter(Boolean)
              .join(' · ');
            return (
              <div className="section-summary">
                <AutoTooltip ghost maxWidth="100%">
                  {`${intl.formatMessage({ id: 'models.form.roles.inherited' })}: ${summary || '-'}`}
                </AutoTooltip>
              </div>
            );
          }}
        </Form.Item>
      )}
    </RoleSection>
  );
};

export default OverrideSection;
