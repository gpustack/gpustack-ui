import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Switch, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    padding: 14px 10px 12px;
    margin-bottom: 24px;
    /* Layout lives on the Flex in the JSX; this only carries typography. */
    .section-title {
      font-size: 14px;
      color: ${token.colorText};
    }
    .title-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: ${token.colorTextTertiary};
    }
    /* Also used by help icons inside a card body, not just the header. */
    .title-help {
      color: ${token.colorTextTertiary};
      cursor: help;
    }
    /* Label attached to a switch/checkbox in a card body (Seed's "increment per
       stage"): a control label, not a second title, so it stays a step back from
       the card title. */
    .row-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: ${token.colorTextSecondary};
    }
  `
}));

interface SectionCardBaseProps {
  /** Already-translated card title. */
  title: React.ReactNode;
  /** Tooltip behind the "?" next to the title. Omit for no help icon. */
  tip?: React.ReactNode;
  /**
   * Whether the body is shown — it gates `children` and the header's bottom gap
   * alike, so a card never has to repeat its own flag inside `children`.
   * Defaults to "there are children", which covers the always-open cards.
   *
   * NOTE for callers deriving this from a form value: the gated `Form.Item`s are
   * UNMOUNTED while closed, and `Form.useWatch(name, form)` reads
   * getFieldsValue() — registered fields only. Watch with `{ form, preserve:
   * true }` or the card can never open from prefilled data.
   */
  open?: boolean;
  children?: React.ReactNode;
}

/**
 * The header's right-hand control, as a union so that "built-in Switch" and
 * "your own control" are mutually exclusive at the type level. Accepting both
 * would silently drop whichever one lost the runtime check — and four of the
 * cards put a registered `Form.Item` in `extra`, so losing it would unregister
 * a field and quietly strip it from the submitted payload.
 */
type SectionCardHeaderProps =
  | {
      /** Opt-in card: renders the standard small Switch bound to `open`. */
      onOpenChange: (open: boolean) => void;
      /** Disables the built-in Switch. */
      disabled?: boolean;
      extra?: never;
    }
  | {
      onOpenChange?: never;
      disabled?: never;
      /** Header's right-hand control: a form-bound switch, Segmented, Tag… */
      extra?: React.ReactNode;
    };

type SectionCardProps = SectionCardBaseProps & SectionCardHeaderProps;

/**
 * The benchmark form's opt-in sub-feature card: a bordered rounded panel whose
 * title carries a "?" help tooltip on the left and a control on the right, with
 * the body revealed below. Mirrors the model form's "Scheduled Scaling" section.
 *
 * Not core-ui's `SwitchCard`, for three reasons that remain after this component
 * grew its own Switch: its body visibility is tied to its OWN switch value, so
 * the four cards whose header is not a plain Switch (form-bound switches, a
 * Segmented, a stepper) would have to pass `showSwitch={false}` and then abuse
 * `value` to mean "body is open"; it has no way to disable that switch, which
 * every card here needs in EDIT; and its radius, padding, body gap and title
 * weight all differ from this design.
 *
 * `open` is always controlled — there is deliberately no `defaultValue`. Every
 * card here derives its open state from form values (and its toggle clears or
 * seeds those values), so an internally-owned copy would only ever drift.
 */
const SectionCard: React.FC<SectionCardProps> = ({
  title,
  tip,
  open,
  onOpenChange,
  disabled,
  extra,
  children
}) => {
  const { styles } = useStyles();
  const bodyOpen = open ?? !!children;

  return (
    <div className={styles.card}>
      <Flex
        align="center"
        justify="space-between"
        className="section-title"
        style={{ marginBottom: bodyOpen ? 16 : 0 }}
      >
        <span className="title-label">
          {title}
          {tip && (
            <Tooltip title={tip}>
              <QuestionCircleOutlined className="title-help" />
            </Tooltip>
          )}
        </span>
        {onOpenChange ? (
          <Switch
            size="small"
            checked={bodyOpen}
            disabled={disabled}
            onChange={onOpenChange}
          />
        ) : (
          extra
        )}
      </Flex>
      {bodyOpen && children}
    </div>
  );
};

export default SectionCard;
