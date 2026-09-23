import { queryClusterTopology } from '@/pages/cluster-management/apis';
import { topologyLayerLabel } from '@/pages/cluster-management/config';
import {
  NODE_LAYER,
  TopologyLayerView,
  TopologyView
} from '@/pages/cluster-management/config/types';
import { Select as SealSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Segmented } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { FormData } from '../config/types';

const useStyles = createStyles(({ css }) => ({
  explain: css`
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
  `,
  /* One frame around both rows.
     ⚠️ The inner select's own outline is painted TRANSPARENT rather than
     removed. `SealSelect` wraps antd and does not forward `variant`, so the
     border cannot be turned off through props; and `border: none` would
     collapse 2px of height and lift the value off the baseline «传输方案»
     sits on. Keeping the box model and dropping only the paint leaves the
     two fields the same height. */
  affinity: css`
    border: 1px solid var(--ant-color-border);
    border-radius: var(--ant-border-radius-lg, 8px);
    .ant-select,
    .ant-select .ant-select-selector {
      border-color: transparent !important;
      box-shadow: none !important;
    }
    .unmet-row {
      /* The divider, and the only border inside the frame. */
      border-top: 1px solid var(--ant-color-border-secondary);
      padding: 8px 12px;
    }
    .unmet-label {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
  `
}));

/**
 * «至少在同一 ___，否则不部署» — the group's placement floor.
 *
 * 🔑 The question is «低于什么档次宁可不部署», never «你想要哪一层». The solver
 * already places into the tightest domain that fits, so the only thing this
 * control adds is a floor to refuse below.
 *
 * 🔴 **The options come from the cluster's declared topology, not from a
 * capacity probe.** An earlier version asked `gather-feasibility` for the
 * tiers and rendered each one with a live «放得下 / 放不下» verdict. Two things
 * killed it. On a healthy fleet every tier answers «放得下», so five identical
 * green strings bought nothing and cost the whole right half of the control.
 * And when the probe could not answer — which it could not here, because it
 * solves against a form that is still half-filled — the tier LIST came back
 * empty too, leaving «尽量靠近» as the only option on a cluster that had racks
 * declared. Feasibility is a verdict about a finished configuration; asking
 * for it while the user is still typing conflated «这一档放不下» with «我还不
 * 知道». So the list is now a fact about the cluster, always available, and
 * the fit check belongs to the final review before submit.
 *
 * The most useful option is free: the leaf layer is built in, so «至少同机»
 * exists even in a cluster that declared no topology at all.
 */
const GatherLocality: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const clusterId = Form.useWatch('cluster_id', form);
  const strategy = Form.useWatch(['gather', 'strategy'], form);
  const layer = Form.useWatch(['gather', 'layer'], form);

  const [topology, setTopology] = useState<TopologyView | null>(null);
  const [failed, setFailed] = useState(false);
  /** Rotated per fetch so a slow answer cannot paint over a fresher one. */
  const sessionRef = useRef(0);

  /**
   * Fetched when the cluster changes — that IS the action, and it is the only
   * input the answer depends on. Cheap and cacheable, unlike the capacity
   * solve it replaces: a cluster's declared layers do not move while a form is
   * being filled in, so there is nothing to debounce.
   */
  const fetchTopology = async (id: number) => {
    const session = ++sessionRef.current;
    try {
      const result = await queryClusterTopology(
        { id },
        { skipErrorHandler: true }
      );
      if (sessionRef.current !== session) {
        return;
      }
      setTopology(result);
      setFailed(false);
    } catch (e) {
      if (sessionRef.current !== session) {
        return;
      }
      // 🔴 Never an error state. Without the declaration the control still
      // works — «尽量靠近» and «至少同机» need no topology at all — so this
      // degrades to fewer options rather than to a broken field.
      setTopology(null);
      setFailed(true);
    }
  };

  useEffect(() => {
    if (!clusterId) {
      setTopology(null);
      return;
    }
    fetchTopology(clusterId);
  }, [clusterId]);

  /**
   * Root-to-leaf, and only the layers that mean something here:
   *
   * - the built-in host layer is offered as «至少同机», always, even for a
   *   cluster that declared no topology at all;
   * - a declared layer is offered once at least one worker resolves a value
   *   there. An `active: false` layer is a name with nothing behind it, and
   *   refusing to deploy below a tier no machine belongs to would refuse
   *   everything.
   *
   * 🔴 There is no «至少同一加速器域» special tier any more, and no per-chain
   * grouping around it. The domain used to be its own candidate set, offered
   * beside the layers with a warning that the two could not be compared. It is
   * now whatever rung the operator declared it as — if they named a layer
   * `accelerator_domain`, it appears here as «至少同一加速器域» through the very
   * same code path as «至少同一机柜», and it sorts into the chain where they put
   * it. The unanswerable «同超节点 vs 同机柜，哪个更紧» is gone because the chain
   * now answers it.
   */
  const treeLayers = (topology?.layers || []).filter(
    (item) => item.active && item.id !== NODE_LAYER
  );

  /**
   * 🔴 Two controls, because this was always two questions.
   *
   * «优先放在» is a *target* — how close do you want them. «放不下时» is a
   * failure posture — and if that cannot be met. One dropdown could only
   * offer three of the four combinations: "anywhere, lenient" and "at least
   * X, or refuse", with the one most deployments actually want — "aim for X,
   * but ship it either way" — unreachable. That gap is why the old options
   * read as threats: every tier came with «否则不部署» welded on.
   *
   * The wire shape is unchanged; what changed is that `PreferGather` with a
   * layer is now meaningful. It places exactly as before (the solver always
   * takes the tightest domain that fits) and marks the model `gather_unmet`
   * if the group ends up looser than the target — so the ask and the outcome
   * are both recorded, which under the old lenient option neither was.
   */
  const AUTO = 'auto';
  const target = layer || AUTO;
  const refuses = strategy === 'MustGather';

  const setGather = (nextLayer?: string, nextRefuses?: boolean) => {
    // Written as a pair, always. A layer without a strategy is refused by the
    // backend, and `MustGather` without a layer is refused too — so either
    // field set alone is a payload that cannot be saved.
    form.setFieldValue(['gather', 'layer'], nextLayer);
    form.setFieldValue(
      ['gather', 'strategy'],
      nextLayer && nextRefuses ? 'MustGather' : 'PreferGather'
    );
  };

  const handleTargetChange = (next: string) => {
    // Dropping back to «自动» has to clear the posture as well: "refuse if it
    // does not fit" with nothing to fit inside is the one combination the
    // schema rejects outright.
    setGather(
      next === AUTO ? undefined : next,
      next === AUTO ? false : refuses
    );
  };

  const handleUnmetChange = (next: string) => setGather(layer, next === 'must');

  const tierLabel = (item: TopologyLayerView) =>
    intl.formatMessage(
      { id: 'models.form.gather.target.layer' },
      { layer: topologyLayerLabel(intl, item) }
    );

  const targetOptions: any[] = [
    // 🔴 Stays first and stays the default. The solver finds the tightest fit
    // itself, which is where the overwhelming majority should stop.
    {
      value: AUTO,
      label: intl.formatMessage({ id: 'models.form.gather.target.auto' }),
      desc: intl.formatMessage({ id: 'models.form.gather.target.auto.tips' })
    },
    // The built-in leaf, below every declared layer.
    {
      value: NODE_LAYER,
      label: intl.formatMessage({ id: 'models.form.gather.target.host' }),
      // Names *who* has to be together, which is the half a tier name cannot
      // carry — and the half that was ambiguous: the router is excluded, on
      // the server too (`role_demands` / `_gather_unmet`).
      desc: intl.formatMessage({ id: 'models.form.gather.target.host.tips' })
    },
    // Flat, in chain order. The list was briefly grouped under «层级» /
    // «加速器域» headings; with one chain a heading would name a distinction
    // that no longer exists, and chain order already says which rung is wider.
    ...treeLayers.map((item) => ({ value: item.id, label: tierLabel(item) }))
  ];

  const unmetOptions = [
    {
      value: 'prefer',
      label: intl.formatMessage({ id: 'models.form.gather.unmet.prefer' }),
      desc: intl.formatMessage({ id: 'models.form.gather.unmet.prefer.tips' })
    },
    {
      value: 'must',
      label: intl.formatMessage({ id: 'models.form.gather.unmet.must' }),
      desc: intl.formatMessage({ id: 'models.form.gather.unmet.must.tips' })
    }
  ];

  // Assigned to consts rather than written inline: an inline arrow in JSX is a
  // new component type on every render, which antd's Select rebuilds the whole
  // dropdown for.
  const optionRender = (option: any) => (
    <Flex vertical gap={2}>
      <span>{option?.data?.label}</span>
      {option?.data?.desc && (
        <span className={styles.explain}>{option.data.desc}</span>
      )}
    </Flex>
  );

  /**
   * The gloss rides the closed control too, not just the open list: «自动»
   * and «同机» are both names whose meaning is not in them.
   *
   * ⚠️ Looked up by value rather than read off the argument. antd hands
   * `labelRender` a `{label, value, key, title}` — **no `data`** — so
   * `option.data.desc` compiles, type-checks as `any`, and silently renders
   * nothing. `optionRender` does get `data`, which is what makes the two
   * look interchangeable when they are not.
   */
  const labelRender = (option: any) => {
    const desc = targetOptions.find(
      (item) => item.value === option?.value
    )?.desc;
    return (
      <Flex align="center" gap={6}>
        <span>{option?.label}</span>
        {desc && <span className={styles.explain}>{desc}</span>}
      </Flex>
    );
  };

  return (
    <>
      {/* Registered so the pair reaches the payload; driven by the select
          below rather than by fields of their own, because the two together
          are one decision. */}
      <Form.Item name={['gather', 'strategy']} hidden noStyle>
        <input />
      </Form.Item>
      <Form.Item name={['gather', 'layer']} hidden noStyle>
        <input />
      </Form.Item>

      {/* One box, two rows: the tier, then what to do when it is missed.
          They are one decision with a qualifier, not two fields, and a
          divider inside a single frame says that in a way two stacked
          controls cannot.

          The frame is drawn here rather than by the select, which paints its
          own — see `affinity` for why that one is made transparent instead
          of removed. No `name` on the item: the pair is written by hand into
          the two hidden items above, because a layer without a strategy (and
          a `MustGather` without a layer) are both payloads the backend
          refuses. */}
      <Form.Item style={{ marginBottom: 12 }}>
        <div className={styles.affinity}>
          <SealSelect
            value={target}
            onChange={handleTargetChange}
            options={targetOptions}
            optionRender={optionRender}
            labelRender={labelRender}
            label={intl.formatMessage({ id: 'models.form.gather.title' })}
            description={intl.formatMessage({
              id: 'models.form.gather.target.tips'
            })}
          ></SealSelect>

          {/* Attached to the field above rather than stacked as a second select,
          because it is not a second question of equal weight — it qualifies
          the one already answered. A `Segmented` also puts both outcomes on
          screen at once, which matters here: the whole reason this control
          exists is that «拒绝部署» used to be welded onto every tier and
          invisible as a choice.

          Only once there is a target. «自动» has nothing to fall short of, so
          a posture control beside it would be asking what to do when a
          condition that does not exist is not met. */}
          {target !== AUTO && (
            <Flex align="center" gap={12} className="unmet-row">
              <span className="unmet-label">
                {intl.formatMessage({ id: 'models.form.gather.unmet' })}
              </span>
              <Segmented
                size="small"
                value={refuses ? 'must' : 'prefer'}
                onChange={handleUnmetChange}
                options={unmetOptions.map(({ value, label }) => ({
                  value,
                  label
                }))}
              />
              {/* The selected option's consequence, in the same row. It is the
              half a two-word label cannot carry, and putting it inside the
              segments would make them wrap. */}
              <span className={styles.explain}>
                {
                  unmetOptions.find(
                    (option) => option.value === (refuses ? 'must' : 'prefer')
                  )?.desc
                }
              </span>
            </Flex>
          )}
        </div>
      </Form.Item>

      {/* 🔴 A hint used to sit here telling the reader to go fill racks in
          under the cluster's Topology to unlock the coarser tiers, with a link
          that opened that drawer. Removed: the deployment form is not where a
          cluster's topology gets declared, and an errand pointing out of the
          form is a worse answer than the option list simply offering what the
          cluster can currently do. */}
    </>
  );
};

export default GatherLocality;
