import useUserSettings from '@/hooks/use-user-settings';
import {
  QuestionCircleOutlined,
  SyncOutlined,
  UndoOutlined
} from '@ant-design/icons';
import {
  AlertBlockInfo,
  CardRadioGroup,
  CheckboxField,
  Input as CInput,
  InputNumber as CInputNumber,
  ModalFooter,
  TextAttribute,
  useSubmitLock
} from '@gpustack/core-ui';
import { YamlEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Alert, Button, Flex, Form, message, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SourceTypeValueMap } from './config';
import type {
  CustomSourceUpsert,
  SourceConfig,
  SourceConfigUpsert,
  SourceKindStatus,
  SourceSlotConfig,
  SourceType
} from './types';
import { OFFICIAL_DEFAULT_HOURS, useSlotConfig } from './use-source-config';

const MAX_AUTO_UPDATE_HOURS = 168;

// The card row's value. Two of the cards say which source serves, the third
// says none of them does — so this is not a `SourceType`, and never reaches the
// request body.
type SlotMode = SourceType | typeof SourceTypeValueMap.BUILTIN;

const useStyles = createStyles(({ css }) => ({
  metaLine: css`
    font-size: var(--font-size-12);
    line-height: 20px;
    color: var(--ant-color-text-tertiary);
  `,
  hintIcon: css`
    color: var(--ant-color-text-tertiary);
  `,
  // ``.label-text`` is a flex row sized by its tallest child, and the label sits
  // right above the value: the badge's stock 18px line and vertical padding
  // would grow that row into the text below it. Doubled selector to outrank the
  // library's own class, which loads first.
  officialTag: css`
    && {
      line-height: 14px;
      padding-block: 0;
      padding-inline: 6px;
    }
  `,
  // Flush left, so the row reads as part of the field above it rather than as
  // an indented toolbar.
  linkRow: css`
    .ant-btn {
      padding-inline: 0;
    }
  `
}));

// A failed write answers with `{code, reason, message}`; these requests opt out
// of the global error toast so the reason lands inside the drawer instead.
const errorMessageOf = (error: any): string =>
  error?.response?.data?.message ||
  error?.data?.message ||
  error?.message ||
  '';

// The editor is seeded with a commented schema hint, and empty content is a
// *valid* source the server would normalize into an empty feed — so the
// untouched hint counts as "nothing configured", the same as a blank box.
const hasMeaningfulContent = (text: string) =>
  text.split('\n').some((line) => line.trim() && !line.trim().startsWith('#'));

/**
 * The refresh cadence, in hours, of whichever layer is showing. One number
 * carries both facts the server stores in one field: 0 is off, and any other
 * value is how often it re-reads — so the checkbox derives from the number
 * rather than being a second source of truth that could disagree with it.
 */
const AutoUpdateField: React.FC<{
  description: string;
  hours: number;
  onChange: (hours: number) => void;
}> = ({ description, hours, onChange }) => {
  const intl = useIntl();
  return (
    <>
      <CheckboxField
        label={intl.formatMessage({ id: 'common.source.autoUpdate' })}
        description={description}
        checked={hours > 0}
        onChange={(e) =>
          onChange(e.target.checked ? OFFICIAL_DEFAULT_HOURS : 0)
        }
      ></CheckboxField>
      {/* Off is the absence of the box rather than a value in it, so the
          interval starts at 1 — clearing the box normalizes back to it. */}
      {hours > 0 && (
        <CInputNumber
          label={intl.formatMessage({
            id: 'common.source.autoUpdate.interval'
          })}
          min={1}
          max={MAX_AUTO_UPDATE_HOURS}
          precision={0}
          value={hours}
          onChange={(value) =>
            onChange(Math.min(Number(value) || 1, MAX_AUTO_UPDATE_HOURS))
          }
        ></CInputNumber>
      )}
    </>
  );
};

interface SourceSlotFormProps {
  slot: SourceSlotConfig;
  // This kind's entry in the shared probe status: the last failed refresh and
  // the file it is published as.
  status?: SourceKindStatus;
  // The directory the official files are published under.
  otaServerUrl: string;
  // A write landed, so the probe and the list behind the drawer are stale.
  onSaved: () => void;
  // Closes the drawer, for the Cancel this form's footer carries.
  onCancel: () => void;
  // The drawer's fixed bottom bar, to render this form's buttons into. Null
  // while another tab has it: every tab stays mounted, so the bar is handed to
  // one of them at a time.
  footerContainer: HTMLElement | null;
}

/**
 * Configures one kind of content: where it comes from, and how often that is
 * re-read.
 *
 * One row of cards answers the whole question of where it comes from — a URL,
 * (for the catalog) inline text, or what this release was packaged with — and
 * everything below the row describes whichever card is selected. The factory
 * card sits last because it is the fall-back: it takes remote content out of
 * service and leaves the packaged baseline serving on its own, keeping what is
 * configured parked for the way back. It is a value like any other, applied by
 * Save rather than the moment it is clicked, which is what lets a source that
 * turns out to be broken be corrected without first putting it back in service.
 *
 * Between the two online cards, a source of your own *is* the input being
 * filled in; the official file's own address is what the box holds by
 * default, and Reset is how you get back to it. The auto update cadence belongs
 * to whichever of the two is in effect, so one checkbox edits one number.
 *
 * A URL is fetched server-side on every save, which makes Save the re-sync
 * action too; the refetch button is the cheaper variant that reuses what is
 * already stored, and is disabled while the form is dirty.
 */
const SourceSlotForm: React.FC<SourceSlotFormProps> = ({
  slot,
  status,
  otaServerUrl,
  onSaved,
  onCancel,
  footerContainer
}) => {
  const intl = useIntl();
  const { styles, cx } = useStyles();
  const { isDarkTheme } = useUserSettings();
  const [form] = Form.useForm();
  const { loading: submitting, guard, run } = useSubmitLock();
  const { config, load, save, reload } = useSlotConfig(slot.kind);

  // Whether remote content serves at all. The factory card is this axis, so it
  // is an unsaved edit like everything else in the form until Save writes it.
  const [remoteEnabled, setRemoteEnabled] = useState(true);
  // The editor is uncontrolled (a controlled monaco reformats on every
  // keystroke), so its text is read through the ref and only mirrored into
  // state when the branch is about to unmount.
  const editorRef = useRef<any>(null);
  // Whether that text amounts to content, which is what decides custom vs
  // official and so has to re-render — the one thing about the editor's content
  // that is tracked live. The text itself stays out of state for the reason
  // above.
  const [fileHasContent, setFileHasContent] = useState(false);
  const [formState, setFormState] = useState({
    sourceType: SourceTypeValueMap.URL as SourceType,
    content: '',
    customHours: 0,
    officialHours: OFFICIAL_DEFAULT_HOURS
  });
  const urlValue: string = Form.useWatch('url', form) ?? '';
  const [alert, setAlert] = useState('');
  const [reloading, setReloading] = useState(false);
  // The first read failed, so nothing on screen came from the server. Its own
  // state rather than an `alert` string: editing a field clears `alert`, and
  // this has to outlive that — the form stays unwritable until a read succeeds.
  const [loadFailed, setLoadFailed] = useState(false);

  const isFileMode =
    slot.allowFile && formState.sourceType === SourceTypeValueMap.FILE;
  const isUrlMode = !isFileMode;
  // The row projects the two states rather than holding a third of its own:
  // which source is configured survives being taken out of service, which is
  // exactly what parking it means.
  const mode: SlotMode = remoteEnabled
    ? formState.sourceType
    : SourceTypeValueMap.BUILTIN;

  // The official file this kind publishes — the starting point for content of
  // your own, which replaces exactly that file. Guarded to http(s)
  // because the OTA server is server-configurable and this ends up in an href.
  // The trailing slash is stripped the way the server strips it joining the same
  // two halves (`sources/probe.py:_ota_url`, which tolerates one because a
  // configured OTA server URL commonly carries it): the address has to come out
  // byte-identical to the one the server reads as "follow the official source",
  // or an OTA server URL configured with a trailing slash would fail
  // `urlIsOfficial` below and save the official address as a custom URL.
  const officialFileUrl =
    status?.filename && /^https?:\/\//i.test(otaServerUrl)
      ? `${otaServerUrl.replace(/\/+$/, '')}/${status.filename}`
      : '';
  // The box holds the official file's own address, which the server reads
  // as "follow the official source" (``_means_the_official_source``) — so the
  // two agree on what is typed there. Also what the badge marks: the one
  // address a user did not choose is worth telling apart from one they did.
  const urlIsOfficial =
    !!officialFileUrl && urlValue.trim() === officialFileUrl;
  // What is filled in decides the source: a source of the admin's own, or the
  // official one.
  const customConfigured = isFileMode
    ? fileHasContent
    : !!urlValue.trim() && !urlIsOfficial;
  // Only the editor gets this: downloading the official file is what inline
  // content of your own starts from, while the URL branch has nothing to open —
  // its box already shows the address it would otherwise follow. Absent until
  // the probe reports an OTA server URL.
  const officialFileLink = officialFileUrl ? (
    <a
      className="m-l-8"
      href={officialFileUrl}
      target="_blank"
      rel="noreferrer"
    >
      {intl.formatMessage({ id: 'common.source.official.link' })}
    </a>
  ) : null;

  // What following the official source means for this kind. Carried by the two
  // places that talk about going back to it — the editor's tooltip and Reset —
  // rather than sitting under the URL box, whose badge already names it.
  const officialDescription = intl.formatMessage({
    id: slot.officialDescriptionKey
  });

  const readContent = () =>
    editorRef.current?.getValue?.() ?? formState.content;

  const seedForm = (cfg: SourceConfig) => {
    // Nothing configured shows the official address itself rather than an empty
    // box: the server reads that address as "follow the official source", so
    // what is on screen is what is in effect.
    form.setFieldsValue({ url: cfg.custom?.url || officialFileUrl });
    setRemoteEnabled(cfg.remote_enabled);
    setFileHasContent(hasMeaningfulContent(cfg.custom?.content || ''));
    setFormState({
      sourceType:
        cfg.custom?.source_type === SourceTypeValueMap.FILE
          ? SourceTypeValueMap.FILE
          : SourceTypeValueMap.URL,
      content: cfg.custom?.content || slot.contentTemplate || '',
      customHours: cfg.custom?.auto_update_hours || 0,
      officialHours: cfg.official.auto_update_hours
    });
  };

  // The slot is mounted with the drawer, so this runs once per open. A failed
  // read leaves the form untouched rather than seeded from a placeholder, so
  // there is nothing on screen for Save to write back over the real thing.
  useEffect(() => {
    const init = async () => {
      const data = await load();
      setLoadFailed(!data);
      if (data) {
        seedForm(data);
      }
    };
    init();
  }, []);

  // The address rides the probe, which races the config load, so seeding may
  // have run without it. Fill it in when it lands — never over a URL of the
  // admin's own, and never over an empty box they cleared themselves
  // (`urlValue` is deliberately not a dependency). A failed read is excluded
  // for the same reason it skips `seedForm`: `config` is then the placeholder,
  // whose null `custom` would otherwise read as "nothing configured" and put an
  // address on screen that no read ever confirmed.
  useEffect(() => {
    if (
      !loadFailed &&
      officialFileUrl &&
      !config.custom &&
      !form.getFieldValue('url')
    ) {
      form.setFieldsValue({ url: officialFileUrl });
    }
  }, [officialFileUrl, config.custom, loadFailed]);

  // Mirrors gpustack/server/sources/core.py: decidable without a request. An
  // empty box is not an error here — it is how the official source is chosen.
  const validateSourceUrl = (_: any, value: string) => {
    if (!value?.trim()) {
      return Promise.resolve();
    }
    let parsed: URL;
    try {
      parsed = new URL(value.trim());
    } catch {
      return Promise.reject(
        new Error(intl.formatMessage({ id: 'common.source.url.scheme' }))
      );
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return Promise.reject(
        new Error(intl.formatMessage({ id: 'common.source.url.scheme' }))
      );
    }
    if (parsed.username || parsed.password) {
      return Promise.reject(
        new Error(intl.formatMessage({ id: 'common.source.url.credentials' }))
      );
    }
    if (!parsed.hostname) {
      return Promise.reject(
        new Error(intl.formatMessage({ id: 'common.source.url.host' }))
      );
    }
    return Promise.resolve();
  };

  // The row moves two axes. The factory card only takes remote content out of
  // service, leaving `sourceType` where it was — that is what says which
  // source to park. A typed URL survives the File branch either way (the form
  // is only hidden, never unmounted), and `readContent` mirrors the editor's
  // text into state on the way out of it, falling back to state when the editor
  // is not mounted at all.
  const handleModeChange = (value: SlotMode) => {
    const content = readContent();
    setRemoteEnabled(value !== SourceTypeValueMap.BUILTIN);
    setFormState({
      ...formState,
      content,
      sourceType:
        value === SourceTypeValueMap.BUILTIN ? formState.sourceType : value
    });
    setFileHasContent(hasMeaningfulContent(content || ''));
  };

  // Back to the default: the official address *is* the official source, so this
  // puts it back rather than leaving an empty box — the change lands with Save
  // like any other edit.
  const handleReset = () => {
    setAlert('');
    form.setFieldsValue({ url: officialFileUrl });
    editorRef.current?.setValue?.(slot.contentTemplate || '');
    setFormState({ ...formState, content: slot.contentTemplate || '' });
    setFileHasContent(false);
  };

  // The form carries unsaved edits vs the persisted config. The refetch button
  // acts on what is *stored*, so it is blocked while the form is dirty — Save is
  // what applies an edit, and Save fetches on its own.
  const isDirty = (): boolean => {
    if (remoteEnabled !== config.remote_enabled) {
      return true;
    }
    if (formState.officialHours !== config.official.auto_update_hours) {
      return true;
    }
    const custom = config.custom;
    if (customConfigured !== !!custom) {
      return true;
    }
    if (!custom) {
      return false;
    }
    if (formState.sourceType !== custom.source_type) {
      return true;
    }
    if (isUrlMode) {
      return (
        urlValue.trim() !== (custom.url || '') ||
        formState.customHours !== (custom.auto_update_hours || 0)
      );
    }
    return (formState.content || '') !== (custom.content || '');
  };

  const dirty = isDirty();
  // A stored URL of the admin's re-reads itself; the official slot runs one
  // round. Stored inline content has nothing to fetch, and a kind whose
  // official updates are off stays out of the round by design — offering the
  // button there would lie. Nothing is refreshed at all while fallen back.
  const storedIsUrl = config.custom?.source_type === SourceTypeValueMap.URL;
  const showRefetch = remoteEnabled && (config.custom ? storedIsUrl : true);
  // A failed read rules it out on its own: `config` is then the placeholder,
  // whose cadence of 12 would otherwise offer a refetch of a slot nothing is
  // known about — under a banner saying exactly that.
  const canRefetch =
    !dirty &&
    !loadFailed &&
    (config.custom ? storedIsUrl : config.official.auto_update_hours > 0);
  // A cadence belongs to something that gets re-read, and inline content never
  // is. While that branch is still empty the cadence in play is the
  // official one — true, but under a file editor it reads as if the file had an
  // update schedule, so it stays in the URL branch where its subject is visible.
  const showAutoUpdate = remoteEnabled && !isFileMode;

  const buildPayload = async (): Promise<SourceConfigUpsert | null> => {
    const base = {
      remote_enabled: remoteEnabled,
      official: { auto_update_hours: formState.officialHours }
    };
    // Falling back never deletes. The inputs are hidden while the factory card
    // is selected, so an empty box there is a leftover rather than a choice just
    // made — what is configured is kept, parked, for the way back. Dropping a
    // source is done from an online card, where the box that says so is on
    // screen.
    if (!remoteEnabled && !customConfigured) {
      const parked: CustomSourceUpsert | null = config.custom
        ? {
            source_type: config.custom.source_type,
            url: config.custom.url,
            content: config.custom.content,
            auto_update_hours: config.custom.auto_update_hours
          }
        : null;
      return { ...base, custom: parked };
    }
    if (isFileMode) {
      const content = readContent();
      return {
        ...base,
        custom: hasMeaningfulContent(content ?? '')
          ? {
              source_type: SourceTypeValueMap.FILE,
              content,
              // A file source has nothing to re-fetch.
              auto_update_hours: 0
            }
          : null
      };
    }
    // Empty, or the official address itself: both say "follow the official
    // source", so neither is sent as a source of the admin's own.
    if (!customConfigured) {
      return { ...base, custom: null };
    }
    let values;
    try {
      values = await form.validateFields();
    } catch {
      // field errors render inline
      return null;
    }
    return {
      ...base,
      custom: {
        source_type: SourceTypeValueMap.URL,
        url: values.url.trim(),
        auto_update_hours: formState.customHours
      }
    };
  };

  const applyWrite = (payload: SourceConfigUpsert) =>
    guard(() =>
      run(async () => {
        try {
          setAlert('');
          seedForm(await save(payload));
          message.success(intl.formatMessage({ id: 'common.message.success' }));
          onSaved();
        } catch (error) {
          setAlert(errorMessageOf(error));
        }
      })
    );

  const handleSave = async () => {
    const payload = await buildPayload();
    if (!payload) {
      // Field errors render inline, and the branch that owns them may be the one
      // the factory card is hiding — put it back on screen with the message.
      setRemoteEnabled(true);
      return;
    }
    applyWrite(payload);
  };

  const handleRefetch = async () => {
    setReloading(true);
    try {
      setAlert('');
      // One call whichever layer serves this kind — a stored URL of the admin's,
      // or the official slot. Neither reaches the other two kinds, and a failure
      // in either arrives as a rejected request rather than a per-kind entry in
      // a round's report.
      const { changed } = await reload();
      onSaved();
      message[changed ? 'success' : 'info'](
        intl.formatMessage({
          id: changed
            ? 'common.message.success'
            : 'common.source.sync.unchanged'
        })
      );
    } catch (error) {
      setAlert(errorMessageOf(error));
      // The failure now lives on the probe too — surface it as the persistent
      // banner alongside the last good content.
      onSaved();
    } finally {
      setReloading(false);
    }
  };

  // Acts on what is *stored*, so it is blocked while the form is dirty — Save is
  // what applies an edit, and Save fetches on its own.
  const refetchButton = (
    <Tooltip
      title={
        dirty
          ? intl.formatMessage({ id: 'common.source.sync.hint.dirty' })
          : undefined
      }
    >
      <span style={{ display: 'inline-flex' }}>
        {/* Default styling, like Cancel beside it: re-reading a source the form
            already points at is not the action this drawer is here for. */}
        <Button
          icon={<SyncOutlined />}
          disabled={!canRefetch}
          loading={reloading}
          onClick={handleRefetch}
        >
          {/* One wording, two keys: the branches reach different endpoints (see
              `handleRefetch`) and stay separately translatable. */}
          {intl.formatMessage({
            id: config.custom
              ? 'common.source.sync.custom'
              : 'common.source.sync.official'
          })}
        </Button>
      </span>
    </Tooltip>
  );

  return (
    <>
      <Flex vertical gap={16}>
        {/* A write that did not land wins over a read that did not: `alert` only
          appears after an action just taken, while a failed read is the standing
          condition underneath it. */}
        {(alert || loadFailed) && (
          <AlertBlockInfo
            type="danger"
            message={
              alert || intl.formatMessage({ id: 'common.source.load.failed' })
            }
            ellipsis={false}
            maxHeight={120}
          ></AlertBlockInfo>
        )}

        {/* One row for the whole question of where the content comes from, and
          everything below it describes the card that is selected. */}
        <CardRadioGroup<SlotMode>
          // Three columns whatever this slot offers, so a card is always a third
          // of the row: the two a URL-only slot shows would otherwise stretch
          // over half the width each and come out long and flat.
          columns={3}
          value={mode}
          onChange={handleModeChange}
          // Selection reads off the radio and the border; a tinted fill on top of
          // both is a third signal for the same fact.
          ghost
          // A card holds one line of text, so its title is body text rather than
          // the heading the component sizes it as.
          styles={{ title: { fontSize: 'var(--font-size-base)' } }}
          options={[
            {
              label: intl.formatMessage({ id: 'common.source.type.url' }),
              value: SourceTypeValueMap.URL
            },
            ...(slot.allowFile
              ? [
                  {
                    label: intl.formatMessage({
                      id: 'common.source.type.file'
                    }),
                    value: SourceTypeValueMap.FILE
                  }
                ]
              : []),
            {
              label: intl.formatMessage({ id: 'common.source.type.builtin' }),
              value: SourceTypeValueMap.BUILTIN
            }
          ]}
        />

        {/* The factory card hides every input, so it is the one card whose
          consequence has nowhere else to show. antd's own Alert rather than
          `AlertBlockInfo`, whose palette starts at warning — an informational
          banner there comes out uncoloured. */}
        {!remoteEnabled && (
          <Alert
            type="info"
            showIcon
            message={intl.formatMessage({
              id: 'common.source.type.builtin.desc'
            })}
          ></Alert>
        )}

        {/* kept mounted while another branch shows so a typed URL survives */}
        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => setAlert('')}
          style={{ display: remoteEnabled && isUrlMode ? 'block' : 'none' }}
        >
          <Form.Item
            name="url"
            style={{ marginBottom: 0 }}
            rules={[{ validator: validateSourceUrl }]}
          >
            <CInput.Input
              label={intl.formatMessage({ id: 'common.source.url' })}
              description={intl.formatMessage({
                id: 'common.source.empty.hint'
              })}
              // Beside the label rather than after the box: it says what the
              // address *is*, which belongs with the field's name and not with
              // the value. Editing it into a URL of your own drops the badge
              // with the same keystroke that drops the official source. Same
              // component the drawer tags its panels with.
              labelExtra={
                urlIsOfficial ? (
                  <TextAttribute className={cx('m-l-4', styles.officialTag)}>
                    {intl.formatMessage({ id: 'common.source.tag.official' })}
                  </TextAttribute>
                ) : null
              }
            ></CInput.Input>
          </Form.Item>
        </Form>

        {remoteEnabled && isFileMode && (
          <YamlEditor
            ref={editorRef}
            // The editor's header already holds a label and the Import button, so
            // the guidance rides there as a tooltip instead of adding one more
            // line of grey text under a 320px box.
            title={
              <>
                {intl.formatMessage({ id: 'common.source.content' })}
                <Tooltip
                  title={
                    <Flex vertical gap={4}>
                      <span>
                        {intl.formatMessage({
                          id: 'common.source.content.hint'
                        })}
                      </span>
                      <span>
                        {intl.formatMessage(
                          { id: 'common.source.empty.hint.file' },
                          { description: officialDescription }
                        )}
                      </span>
                    </Flex>
                  }
                >
                  <QuestionCircleOutlined
                    className={cx('m-l-4', styles.hintIcon)}
                  />
                </Tooltip>
                {officialFileLink}
              </>
            }
            height={320}
            value={formState.content}
            isDarkTheme={isDarkTheme}
            onChange={(text) =>
              setFileHasContent(hasMeaningfulContent(text || ''))
            }
          ></YamlEditor>
        )}

        {/* The way back to the default, as something to press: the same rule the
          input's tooltip states, but it only makes sense once there is
          something to undo. */}
        {remoteEnabled && customConfigured && (
          <Flex className={styles.linkRow}>
            <Tooltip
              title={intl.formatMessage(
                { id: 'common.source.reset.tip' },
                { description: officialDescription }
              )}
            >
              <Button
                type="link"
                size="small"
                icon={<UndoOutlined />}
                onClick={handleReset}
              >
                {intl.formatMessage({ id: 'common.source.reset' })}
              </Button>
            </Tooltip>
          </Flex>
        )}

        {showAutoUpdate && (
          <AutoUpdateField
            description={intl.formatMessage({
              id: customConfigured
                ? 'common.source.autoUpdate.custom.tip'
                : 'common.source.autoUpdate.official.tip'
            })}
            hours={
              customConfigured ? formState.customHours : formState.officialHours
            }
            onChange={(hours) =>
              setFormState(
                customConfigured
                  ? { ...formState, customHours: hours }
                  : { ...formState, officialHours: hours }
              )
            }
          ></AutoUpdateField>
        )}

        {status?.updated_at && remoteEnabled && (
          <span className={styles.metaLine}>
            {intl.formatMessage(
              { id: 'common.source.lastUpdated' },
              { time: dayjs(status.updated_at).format('YYYY-MM-DD HH:mm:ss') }
            )}
          </span>
        )}

        {remoteEnabled && status?.error && (
          <AlertBlockInfo
            type="warning"
            message={status.error}
            ellipsis={false}
            maxHeight={120}
          ></AlertBlockInfo>
        )}
      </Flex>

      {/* The buttons belong to this form — only their place is the drawer's, so
          they land in the fixed bar rather than at the end of the scrolling
          content. Rendered from here so every state they read (dirty, the
          in-flight write, a failed load) stays where it is produced, and the
          bar holds the active tab's buttons alone. */}
      {footerContainer &&
        createPortal(
          <ModalFooter
            onCancel={onCancel}
            onOk={handleSave}
            loading={submitting}
            // Nothing on screen came from the server when the read failed, so
            // there is no configuration here to write.
            okBtnProps={{ disabled: loadFailed }}
            // The far end of the bar: `description` is the slot on the other
            // side of the footer's `space-between`, which keeps this away from
            // the two buttons that close the drawer.
            description={showRefetch ? refetchButton : undefined}
            // On the bar itself rather than on the buttons, so the padding is
            // there for both ends. Same figures as the footer FormDrawer builds
            // when it is left to its own (`core-ui/form-drawer`), so this
            // drawer's bar lines up with every other one.
            styles={{ wrapper: { padding: '16px 24px 8px' } }}
          ></ModalFooter>,
          footerContainer
        )}
    </>
  );
};

export default SourceSlotForm;
