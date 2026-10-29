import HotKeys, { KeyMap } from '@/config/hotkeys';
import useUserSettings from '@/hooks/use-user-settings';
import {
  ClearOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import {
  AlertInfo,
  IconFont,
  useOverlayScroller,
  useRequestToken
} from '@gpustack/core-ui';
import { JsonEditor } from '@gpustack/core-ui/json-editor';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Flex, Spin, Tag, Tooltip } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import { Resizable } from 're-resizable';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { SYSTEMONE_API, decisionQuery } from '../apis';
import ReferenceParams from '../components/reference-params';
import RightContainer from '../components/right-container';
import ViewCommonCode from '../components/view-common-code';
import { extractErrorMessage } from '../config';
import { decisionSamples } from '../config/samples';
import '../style/decision.less';
import '../style/ground-llm.less';
import { generateDecisionCode } from '../view-code/decision';
import DataForm from './forms';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

// `answers[<question id>]` of the systemone response. The fields below are
// the common System One shape; anything unrecognized falls back to the raw
// JSON view instead of being dropped.
interface DecisionAnswer {
  type?: string;
  choice?: string;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  [key: string]: any;
}

// Response-level extras rendered as a dim summary line above the answers:
// which model answered and what it cost.
interface DecisionMeta {
  model?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

// Both editors are schema-guided (TypeSafe-style split: state and questions
// are separate inputs; each is a Monaco JSON editor). Monaco's json worker
// validates and autocompletes against schemas registered for the editors'
// model paths only, so no other JSON model in the app is affected. The
// schemas mirror the System One contract as implemented by transformers
// serve ("Request types follow https://api.typesafe.ai/openapi.json") but
// deliberately stay guidance, not a gate: the question shape is open and
// engine-dependent (vLLM/SGLang extras differ), so submit only requires
// parseable JSON — schema hints never block it.
const STATE_EDITOR_PATH = 'playground-decision-state.json';
const QUESTIONS_EDITOR_PATH = 'playground-decision-questions.json';

// "System One content": plain text, or a JSON object/array — the engine
// renders objects/arrays as JSON text.
const CONTENT_SCHEMA = {
  anyOf: [{ type: 'string' }, { type: 'object' }, { type: 'array' }],
  description:
    'System One content: plain text, or a JSON object/array (rendered as JSON by the engine).'
};

const STATE_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...CONTENT_SCHEMA,
  description:
    'The situation the decision is made against: plain text, or structured JSON (e.g. chat messages).'
};

const QUESTIONS_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  description:
    'Questions (1-64): question id → definition. The id is the map key; the answer comes back under answers[<id>].',
  minProperties: 1,
  maxProperties: 64,
  additionalProperties: {
    anyOf: [
      { $ref: '#/definitions/choice' },
      { $ref: '#/definitions/score' },
      { $ref: '#/definitions/noul' }
    ]
  },
  definitions: {
    choice: {
      type: 'object',
      description: 'Pick one option from criteria.',
      properties: {
        type: { const: 'choice' },
        instructions: CONTENT_SCHEMA,
        criteria: {
          type: 'object',
          description:
            'Option name → description. The answer is the option name.',
          minProperties: 1,
          maxProperties: 26,
          additionalProperties: {
            anyOf: [{ type: ['string', 'object', 'array', 'null'] }],
            description: 'Option description.'
          }
        }
      },
      required: ['type']
    },
    score: {
      type: 'object',
      description: 'Score the state against ordered levels.',
      properties: {
        type: { const: 'score' },
        instructions: CONTENT_SCHEMA,
        criteria: {
          type: 'array',
          description:
            'Ordered level list (1-26). The answer is the level index.',
          minItems: 1,
          maxItems: 26,
          items: CONTENT_SCHEMA
        }
      },
      required: ['type']
    },
    noul: {
      type: 'object',
      description: 'Binary (yes/no) question.',
      properties: {
        type: { const: 'noul' },
        instructions: CONTENT_SCHEMA,
        criteria: {
          type: 'object',
          description: 'Descriptions for the two sides; both optional.',
          properties: {
            true: CONTENT_SCHEMA,
            false: CONTENT_SCHEMA
          },
          additionalProperties: false
        }
      },
      required: ['type']
    }
  }
};

// Templates inserted by the "+ choice / + score / + noul" buttons. The
// required containers (criteria map / ordered criteria array) come along so
// the insert is immediately runnable.
const QUESTION_TEMPLATES: Record<string, Record<string, any>> = {
  choice: { type: 'choice', instructions: '', criteria: { 'option-1': '' } },
  score: { type: 'score', instructions: '', criteria: ['', '', ''] },
  noul: { type: 'noul', instructions: '' }
};

// A collision-free `question-N` key: the map key IS the identity, two
// entries sharing one would silently overwrite each other.
const nextQuestionKey = (existing: string[]) => {
  let n = existing.length + 1;
  let key = `question-${n}`;
  while (existing.includes(key)) {
    n += 1;
    key = `question-${n}`;
  }
  return key;
};

// The seeded questions editor content: the locale sample as JSON.
const buildSampleQuestions = (sample: {
  criteria: { name: string; description: string }[];
}) =>
  JSON.stringify(
    {
      'question-1': {
        type: 'choice',
        instructions: 'Pick the model best suited.',
        criteria: sample.criteria.reduce(
          (acc, item) => {
            acc[item.name] = item.description;
            return acc;
          },
          {} as Record<string, string>
        )
      }
    },
    null,
    2
  );

const GroundDecision: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const [searchParams] = useSearchParams();
  const requestSource = useRequestToken();
  const requestToken = useRef<any>(null);
  const formRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const answersRegionRef = useRef<any>(null);

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // TypeSafe-style split, both halves JSON editors: `state` follows the
  // spec's content triple (string | object | array) — seeded as structured
  // JSON (chat messages, like TypeSafe's default), editable down to a plain
  // string; `questions` is the open, engine-dependent map, guided by its
  // schema with template inserts and a format action.
  const [stateJson, setStateJson] = useState(() => {
    const sample = decisionSamples[intl.locale] || decisionSamples['en-US'];
    return JSON.stringify(sample?.state ?? {}, null, 2);
  });
  const [questionsJson, setQuestionsJson] = useState(() => {
    const sample = decisionSamples[intl.locale] || decisionSamples['en-US'];
    return sample ? buildSampleQuestions(sample) : '{}';
  });
  const [answers, setAnswers] = useState<Record<string, DecisionAnswer> | null>(
    null
  );
  const [meta, setMeta] = useState<DecisionMeta | null>(null);
  // Preselected declaratively from ?model=… (e.g. a deployment row's "Open
  // in Playground"): the initial state doubles as the form's initialValues,
  // so there is no imperative setFieldsValue effect and no initialized
  // tracking to race the form's mount. Like the rerank playground, no
  // default is picked when the param is absent.
  const [parameters, setParameters] = useState<any>(() => ({
    model: searchParams.get('model') || ''
  }));

  const { initialize } = useOverlayScroller();

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize]);

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      },
      setCollapse() {
        setCollapse(!collapse);
      },
      collapse: collapse
    };
  });

  // The state is the spec's content triple: any JSON string / object /
  // array parses. Numbers/booleans/null are not part of the contract —
  // schema hints flag them, submit only rejects unparseable text. Empty or
  // whitespace-only input is "empty" (not "invalid"): JSON.parse would
  // throw a bare syntax error, so short-circuit to the empty value and let
  // the submit gate render the friendly required message.
  const parseStateJson = (): { value?: any; error?: string } => {
    if (!stateJson.trim()) {
      return { value: '' };
    }
    try {
      return { value: JSON.parse(stateJson) };
    } catch (e: any) {
      return {
        error: intl.formatMessage(
          { id: 'playground.decision.state.invalidJson' },
          { message: e?.message || '' }
        )
      };
    }
  };

  // Passthrough philosophy (design §2.2): the only client-side gate is that
  // the text parses as a JSON object — the question fields inside ride to
  // the engine verbatim (the schema in the editor is guidance, not a gate),
  // and engine errors surface raw below the editor.
  const parseQuestionsJson = (): {
    body?: Record<string, any>;
    error?: string;
  } => {
    try {
      const parsed = JSON.parse(questionsJson);
      if (!_.isPlainObject(parsed)) {
        return {
          error: intl.formatMessage({
            id: 'playground.decision.questions.notObject'
          })
        };
      }
      return { body: parsed as Record<string, any> };
    } catch (e: any) {
      return {
        error: intl.formatMessage(
          { id: 'playground.decision.questions.invalidJson' },
          { message: e?.message || '' }
        )
      };
    }
  };

  // Live input status for the TypeSafe-style affordances: the submit button
  // spells out what blocks the run before the click, and format/template
  // actions are dimmed while the questions text is unparseable.
  const runBlockReason = useMemo(() => {
    if (!parameters.model) {
      return intl.formatMessage({ id: 'playground.decision.run.noModel' });
    }
    const { value: state, error: stateError } = parseStateJson();
    const stateEmpty =
      state == null || state === '' || (_.isObject(state) && _.isEmpty(state));
    if (stateError || stateEmpty) {
      return (
        stateError ||
        intl.formatMessage({ id: 'playground.decision.state.required' })
      );
    }
    const { body, error: parseError } = parseQuestionsJson();
    if (!body) {
      return parseError || null;
    }
    return null;
  }, [parameters.model, stateJson, questionsJson, intl]);

  const questionsParsable = useMemo(() => {
    const { body } = parseQuestionsJson();
    return !!body;
  }, [questionsJson]);

  const viewCodeContent = useMemo(() => {
    const { value: state } = parseStateJson();
    const { body } = parseQuestionsJson();
    return generateDecisionCode({
      api: SYSTEMONE_API,
      parameters: {
        state: state ?? '',
        questions: body || {},
        model: parameters.model || ''
      }
    });
  }, [parameters.model, stateJson, questionsJson]);

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleClear = () => {
    // Reset to the sample rather than empty editors: an empty body teaches
    // nothing, the sample stays one click away.
    const sample = decisionSamples[intl.locale] || decisionSamples['en-US'];
    setStateJson(JSON.stringify(sample?.state ?? {}, null, 2));
    setQuestionsJson(sample ? buildSampleQuestions(sample) : '{}');
    setAnswers(null);
    setMeta(null);
    setError(null);
  };

  // Invalidate + cancel the in-flight run, shared by Stop and model
  // switches: the ref is nulled BEFORE cancel() so the canceled run's
  // isCurrent() guard fails — its late success / catch / finally can no
  // longer touch answers, meta, error, or the loading flag.
  const cancelCurrentRequest = () => {
    const currentToken = requestToken.current;
    requestToken.current = null;
    currentToken?.cancel?.();
    setLoading(false);
  };

  const handleStop = () => {
    cancelCurrentRequest();
  };

  // Re-indent the editor content — the usual rescue after pasting
  // minified JSON from a curl example or an SDK log.
  const handleFormat = () => {
    try {
      setQuestionsJson(JSON.stringify(JSON.parse(questionsJson), null, 2));
      setError(null);
    } catch (e: any) {
      setError(
        intl.formatMessage(
          { id: 'playground.decision.questions.invalidJson' },
          { message: e?.message || '' }
        )
      );
    }
  };

  // Insert a typed question template with a collision-free question-N key,
  // rewriting the whole editor content formatted — a structural edit that
  // also normalizes whatever indentation was there.
  const handleInsertTemplate = (type: string) => {
    const { body, error: parseError } = parseQuestionsJson();
    if (!body) {
      setError(parseError || null);
      return;
    }
    const template = _.cloneDeep(QUESTION_TEMPLATES[type] || {});
    body[nextQuestionKey(Object.keys(body))] = template;
    setQuestionsJson(JSON.stringify(body, null, 2));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await formRef.current?.form?.validateFields?.();
    } catch {
      return;
    }
    if (!parameters.model) {
      return;
    }
    const { value: state, error: stateError } = parseStateJson();
    // Empty in every sense of the content triple: unparseable text was
    // caught above; null / "" / {} / [] carry nothing to decide against.
    const stateEmpty =
      state == null || state === '' || (_.isObject(state) && _.isEmpty(state));
    if (stateError || stateEmpty) {
      setError(
        stateError ||
          intl.formatMessage({ id: 'playground.decision.state.required' })
      );
      return;
    }
    const { body, error: parseError } = parseQuestionsJson();
    if (!body) {
      setError(parseError || null);
      return;
    }

    setLoading(true);
    requestToken.current?.cancel?.();
    requestToken.current = requestSource();
    // Stop and a newer run both cancel this token; once superseded, this
    // run's promises must not touch state — not the error alert, and not
    // the loading flag of the run that replaced it.
    const token = requestToken.current;
    const isCurrent = () => requestToken.current === token;
    try {
      // The selector's model wins: GPUStack resolves the target route from
      // body.model, so the selector is the single source of truth.
      const res: any = await decisionQuery(
        {
          state,
          questions: body,
          model: parameters.model
        },
        {
          cancelToken: token.token
        }
      );
      if (!isCurrent()) {
        return;
      }
      setAnswers(res?.answers || {});
      setMeta(res ?? null);
      // Fresh answers land below the input region — bring the answers
      // section into view.
      answersRegionRef.current?.scrollIntoView?.({ block: 'start' });
    } catch (err: any) {
      // A cancellation is intentional (Stop, or a newer run replacing this
      // one): no error UI for it, and a superseded run leaves the newer
      // run's answers and loading alone.
      if (axios.isCancel(err) || !isCurrent()) {
        return;
      }
      setAnswers(null);
      setMeta(null);
      // The axios response carries the engine's message; fall back to the
      // error itself. extractErrorMessage always yields a string, so the
      // alert never renders nothing.
      setError(extractErrorMessage(err?.response) || extractErrorMessage(err));
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  };

  // ⌘/Ctrl+Enter runs the decision — the keyboard-driven counterpart of the
  // submit button. Monaco edits inside a textarea, hence enableOnFormTags.
  useHotkeys(
    HotKeys.RUN.join(','),
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      if (!loading && !runBlockReason) {
        handleSubmit();
      }
    },
    {
      enabled: !loading,
      enableOnFormTags: true,
      preventDefault: true
    }
  );

  const onValuesChange = (changedValues: any) => {
    if (changedValues.model !== undefined) {
      // Switching models invalidates the in-flight run: cancel it first so
      // its guards fail (a late answer/error from the old model must not
      // land), reset the run state, then adopt the new model.
      cancelCurrentRequest();
      setParameters({ model: changedValues.model });
      // Answers belong to the model that produced them.
      setAnswers(null);
      setMeta(null);
      setError(null);
    }
  };

  const renderConfidence = (answer: DecisionAnswer) => {
    const confidence = Number(answer?.confidence);
    if (answer?.confidence == null || isNaN(confidence)) {
      return null;
    }
    // Confidence semantics are backend-defined (SGLang documents its value
    // as uncalibrated) — show it verbatim, only formatting ≤1 as a percent.
    const label =
      confidence >= 0 && confidence <= 1
        ? `${_.round(confidence * 100, 1)}%`
        : `${_.round(confidence, 2)}`;
    return (
      <Tag color="geekblue">
        {intl.formatMessage({ id: 'playground.decision.answer.confidence' })}:{' '}
        {label}
      </Tag>
    );
  };
  const renderProbabilities = (answer: DecisionAnswer) => {
    const entries = (
      Object.entries(answer?.probabilities || {}) as [string, number][]
    ).filter(([, value]) => typeof value === 'number' && !isNaN(value));
    if (!entries.length) {
      return null;
    }
    // score answers pair probabilities with a legend (level index →
    // description) — show both on the row, ellipsized.
    const legend = answer?.legend as Record<string, string> | undefined;
    // Score answers keep the criteria order (level index ascending);
    // choice answers sort by probability, most likely first.
    const sorted = legend
      ? _.sortBy(entries, ([name]: [string, number]) => Number(name) || 0)
      : _.sortBy(entries, (entry: [string, number]) => -entry[1]);
    const max = _.max(
      entries.map(([, value]: [string, number]) => value)
    ) as number;
    return (
      <div>
        {sorted.map(([name, value]: [string, number]) => {
          // Probabilities normally sum to ~1: draw the raw fraction. Values
          // outside [0, 1] (unnormalized scores) are scaled against the max
          // so the longest bar still fits the track.
          const inUnitRange = value >= 0 && value <= 1;
          const width = inUnitRange
            ? value * 100
            : max > 0
              ? (value / max) * 100
              : 0;
          const label = inUnitRange
            ? `${_.round(value * 100, 1)}%`
            : `${_.round(value, 2)}`;
          const legendText = legend?.[name];
          const displayName = legendText ? `${name}: ${legendText}` : name;
          // choice answers mark the picked option; score answers mark the
          // level nearest the returned (possibly fractional) score.
          const isChosen =
            answer.type === 'choice'
              ? answer.choice === name
              : legend &&
                typeof answer.score === 'number' &&
                String(Math.round(answer.score)) === name;
          return (
            <Flex key={name} align="center" gap={8} className="probability-row">
              <span className="probability-name" title={displayName}>
                {displayName}
              </span>
              <div className="probability-bar-track">
                <div
                  className="probability-bar"
                  style={{ width: `${_.clamp(width, 0, 100)}%` }}
                />
              </div>
              <span className="probability-value">{label}</span>
              {isChosen && (
                <Tag color="gold" variant="filled" style={{ margin: 0 }}>
                  {intl.formatMessage({
                    id: 'playground.decision.answer.choice'
                  })}
                </Tag>
              )}
            </Flex>
          );
        })}
      </div>
    );
  };
  // noul answers carry the true-side value directly (no probabilities map):
  // booleans become a header tag only — a 100%/0% bar would just repeat it —
  // while numeric confidences in [0, 1] ride the probability-row visual as
  // one honest `true` row.
  const renderNoulTag = (answer: DecisionAnswer) => {
    if (answer?.type !== 'noul' || typeof answer?.noul !== 'boolean') {
      return null;
    }
    return (
      <Tag color={answer.noul ? 'green' : undefined}>{String(answer.noul)}</Tag>
    );
  };
  const renderNoulProbability = (answer: DecisionAnswer) => {
    const value = Number(answer?.noul);
    if (
      answer?.type !== 'noul' ||
      typeof answer?.noul !== 'number' ||
      isNaN(value) ||
      value < 0 ||
      value > 1
    ) {
      return null;
    }
    return (
      <Flex align="center" gap={8} className="probability-row">
        <span className="probability-name">true</span>
        <div className="probability-bar-track">
          <div
            className="probability-bar"
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <span className="probability-value">{`${_.round(value * 100, 1)}%`}</span>
      </Flex>
    );
  };
  const renderAnswer = (name: string, answer: DecisionAnswer) => {
    const probabilities =
      renderProbabilities(answer) || renderNoulProbability(answer);
    const score =
      typeof answer?.score === 'number' && !isNaN(answer.score)
        ? answer.score
        : null;
    const noulTag = renderNoulTag(answer);
    return (
      <div className="answer-card" key={name}>
        <Flex
          align="center"
          justify="space-between"
          gap="small"
          style={{ marginBottom: probabilities ? 8 : 0 }}
        >
          <Flex align="center" gap="small">
            <span style={{ fontWeight: 500 }}>{name}</span>
            {answer?.type && <Tag>{answer.type}</Tag>}
          </Flex>
          <Flex align="center" gap="small">
            {score != null && (
              <Tag color="gold">
                {intl.formatMessage({ id: 'playground.decision.answer.score' })}
                : {_.round(score, 4)}
              </Tag>
            )}
            {noulTag}
            {renderConfidence(answer)}
          </Flex>
        </Flex>
        {probabilities}
        {!probabilities && score == null && !noulTag && (
          <pre className="answer-raw">{JSON.stringify(answer, null, 2)}</pre>
        )}
      </div>
    );
  };
  return (
    <div className="ground-left-wrapper decision">
      <div className="ground-left">
        <Flex component="div" vertical className="center" ref={scroller}>
          {/* Single scroll column: the editors scroll internally at fixed
              heights, answers follow below, section titles stick. */}
          <Flex component="div" vertical className="decision-input-region">
            <Flex
              component="div"
              justify="space-between"
              align="center"
              className="section-header"
            >
              <h3 className="m-b-0 font-size-14 line-24 font-500">
                {intl.formatMessage({ id: 'playground.decision.state' })}
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.decision.state.tooltip'
                  })}
                >
                  <QuestionCircleOutlined className="m-l-4" />
                </Tooltip>
              </h3>
              <div className="flex-center gap-10">
                <Button
                  size="middle"
                  icon={<ClearOutlined />}
                  disabled={loading}
                  onClick={handleClear}
                >
                  {intl.formatMessage({ id: 'common.button.clear' })}
                </Button>
                {/* Same submit affordance as the rerank/embedding document
                    header: icon-only primary button beside Clear, morphing
                    into Stop while the request is in flight; disabled with
                    the blocking reason on hover (TypeSafe-style lint
                    gating). */}
                {!loading ? (
                  <Tooltip
                    title={
                      <span>
                        {runBlockReason ||
                          intl.formatMessage({ id: 'common.button.submit' })}
                        <span className="run-shortcut">
                          {KeyMap.RUN.textKeybinding}
                        </span>
                      </span>
                    }
                  >
                    <Button
                      size="middle"
                      type="primary"
                      onClick={handleSubmit}
                      disabled={!!runBlockReason}
                      // The tooltip title is not a reliable accessible name;
                      // mirror it as the label (the blocking reason reads
                      // out when the run is gated).
                      aria-label={
                        runBlockReason ||
                        intl.formatMessage({ id: 'common.button.submit' })
                      }
                      icon={
                        <SendOutlined rotate={0} className="font-size-14" />
                      }
                      style={{ width: 60 }}
                    ></Button>
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={intl.formatMessage({ id: 'common.button.stop' })}
                  >
                    <Button
                      size="middle"
                      type="primary"
                      style={{ width: 60 }}
                      onClick={handleStop}
                      // Icon-only control: the tooltip is not a dependable
                      // accessible name, so carry the stop label explicitly.
                      aria-label={intl.formatMessage({
                        id: 'common.button.stop'
                      })}
                      icon={
                        <IconFont
                          type="icon-stop1"
                          className="font-size-12"
                        ></IconFont>
                      }
                    ></Button>
                  </Tooltip>
                )}
              </div>
            </Flex>
            {/* State follows the spec's content triple (string | object |
                array): seeded as structured JSON (chat messages, like
                TypeSafe's default), editable down to a plain string —
                schema hints flag off-contract values, only unparseable text
                blocks submit. The block height is draggable (TypeSafe-style
                row resize) between the state and questions editors. */}
            <Resizable
              className="state-editor-resizable"
              defaultSize={{ width: '100%', height: 180 }}
              minHeight={72}
              maxHeight={400}
              enable={{ bottom: true }}
              handleClasses={{ bottom: 'decision-resize-handle' }}
              handleStyles={{
                bottom: {
                  position: 'absolute',
                  bottom: '-6px',
                  left: '0',
                  width: '100%',
                  height: '12px',
                  cursor: 'row-resize'
                }
              }}
            >
              <div className="state-editor">
                <JsonEditor
                  isDarkTheme={isDarkTheme}
                  path={STATE_EDITOR_PATH}
                  schema={STATE_JSON_SCHEMA}
                  value={stateJson}
                  onChange={(value) => setStateJson(value ?? '')}
                  height="100%"
                  options={{ lineNumbers: 'off', folding: false }}
                />
              </div>
            </Resizable>

            <Flex
              component="div"
              justify="space-between"
              align="center"
              className="section-header questions-header"
            >
              <h3 className="m-b-0 font-size-14 line-24 font-500">
                {intl.formatMessage({ id: 'playground.decision.questions' })}
              </h3>
              <div className="flex-center gap-10">
                {Object.keys(QUESTION_TEMPLATES).map((type) => (
                  <Button
                    key={type}
                    size="middle"
                    disabled={loading || !questionsParsable}
                    onClick={() => handleInsertTemplate(type)}
                  >
                    <PlusOutlined />
                    {type}
                  </Button>
                ))}
                <Button
                  size="middle"
                  disabled={loading || !questionsParsable}
                  onClick={handleFormat}
                >
                  {intl.formatMessage({
                    id: 'playground.decision.questions.format'
                  })}
                </Button>
              </div>
            </Flex>
            {/* Schema-guided JSON editing: autocomplete/hover/validation for
                the known question shape (scoped to this model's path), with
                template inserts and formatting above. The editor fills the
                remaining input height; syntax errors are marked inline by
                monaco and reflected live in the run bar below. */}
            <div className="questions-editor-wrap">
              <JsonEditor
                isDarkTheme={isDarkTheme}
                path={QUESTIONS_EDITOR_PATH}
                schema={QUESTIONS_JSON_SCHEMA}
                value={questionsJson}
                onChange={(value) => setQuestionsJson(value ?? '')}
                height="100%"
              />
            </div>
          </Flex>

          {/* Token strip between the inputs and the answers — the same
              centered orange affordance as the chat playground
              (ReferenceParams); the input/output breakdown rides on the
              tooltip. The wrapper is always mounted and only its contents
              toggle: OverlayScrollbars restructures `.center`'s direct
              children on init, so React must never insert or remove one
              after mount (insertBefore throws against the moved nodes). */}
          <div className="decision-token-strip">
            {meta?.usage &&
              (meta.usage.input_tokens ?? 0) + (meta.usage.output_tokens ?? 0) >
                0 && (
                <ReferenceParams
                  usage={{
                    prompt_tokens: meta.usage.input_tokens ?? 0,
                    completion_tokens: meta.usage.output_tokens ?? 0,
                    total_tokens:
                      (meta.usage.input_tokens ?? 0) +
                      (meta.usage.output_tokens ?? 0),
                    // Decision runs are one-shot (no streaming), so the
                    // throughput fields stay 0; showOutput=false never
                    // renders them.
                    tokens_per_second: 0,
                    time_per_output_token_ms: 0,
                    time_to_first_token_ms: 0
                  }}
                  showOutput={false}
                ></ReferenceParams>
              )}
          </div>

          {/* Answers follow the inputs in the same scroll column. */}
          <div className="answers-region" ref={answersRegionRef}>
            {error && (
              <div className="m-b-8">
                <AlertInfo type="danger" message={error}></AlertInfo>
              </div>
            )}

            <Flex
              component="div"
              justify="space-between"
              align="center"
              className="section-header"
            >
              <h3 className="m-b-0 font-size-14 line-24 font-500">
                {intl.formatMessage({ id: 'playground.decision.answers' })}
              </h3>
            </Flex>
            {loading && (
              <Spin size="small">
                <div style={{ height: 46 }}></div>
              </Spin>
            )}
            {!loading &&
              answers &&
              Object.entries(answers).map(([name, answer]) =>
                renderAnswer(name, answer)
              )}
            {!loading && answers && _.isEmpty(answers) && (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({
                  id: 'playground.decision.answers.empty'
                })}
              </span>
            )}
            {!loading && !answers && (
              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                {intl.formatMessage({
                  id: 'playground.decision.answers.placeholder'
                })}
              </span>
            )}
          </div>
        </Flex>
      </div>
      <RightContainer collapsed={collapse}>
        <DataForm
          ref={formRef}
          modelList={modelList}
          onValuesChange={onValuesChange}
          initialValues={parameters}
        ></DataForm>
      </RightContainer>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCommonCode>
    </div>
  );
});

export default GroundDecision;
