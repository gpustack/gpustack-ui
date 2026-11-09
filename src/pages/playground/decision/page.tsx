import HotKeys from '@/config/hotkeys';
import useUserSettings from '@/hooks/use-user-settings';
import {
  ClearOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import {
  AlertInfo,
  CopyButton,
  IconFont,
  useRequestToken
} from '@gpustack/core-ui';
import { JsonEditor } from '@gpustack/core-ui/json-editor';
import { useIntl, useSearchParams } from '@umijs/max';
import { App, Button, Flex, Spin, Tag, Tooltip } from 'antd';
import axios from 'axios';
import _ from 'lodash';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { SYSTEMONE_API, decisionQuery } from '../apis';
import ReferenceParams from '../components/reference-params';
import RightContainer from '../components/right-container';
import ThumbImg from '../components/thumb-img';
import UploadImg from '../components/upload-img';
import ViewCommonCode from '../components/view-common-code';
import { extractErrorMessage } from '../config';
import { decisionSamples } from '../config/samples';
import '../style/decision.less';
import '../style/ground-llm.less';
import { generateDecisionCode } from '../view-code/decision';
import DecisionWorkspace, {
  DecisionWorkspaceHandle
} from './decision-workspace';
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

// ============ Image assets (System One media support, issue #6622) ============

// One uploaded image: the base64 data URL kept for preview / requests, plus
// the collision-free placeholder that references it inside any string of the
// state, question instructions, or criteria.
interface DecisionImage {
  placeholder: string;
  dataUrl: string;
}

// A collision-free `img-N` placeholder: collisions are checked against the
// given USED set (parsed tokens from both editors + live image placeholders,
// built by the callers), so a reference written as "\u0069mg-1" is avoided
// too — a raw-text scan would miss it and hand out an in-use name.
const nextImagePlaceholder = (used: Set<string>): string => {
  let n = used.size + 1;
  let key = `img-${n}`;
  while (used.has(key)) {
    n += 1;
    key = `img-${n}`;
  }
  return key;
};

// `data:image/png;base64,AAAA` → `{ format: 'png', dataBase64: 'AAAA' }`.
// URL-sourced "data URLs" (http(s)://…) yield no payload — they are skipped
// for requests (the System One assets contract only carries inline base64).
const splitDataUrl = (
  dataUrl: string
): { format: string; dataBase64: string } | null => {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/.exec(
    dataUrl || ''
  );
  if (!match) {
    return null;
  }
  return { format: match[1].toLowerCase(), dataBase64: match[2] };
};

// Best-effort placeholder injection into the state (issue #6622 item 2):
// - pure-image source (plain string / empty / unparseable) → the bare
//   placeholder string, matching the contract's own `"state": "photo"`;
// - chat-shaped state (array of {role, content: string} messages) → appended
//   to the last text message's content;
// - other shapes (arbitrary objects) are left alone — the thumbnail shows a
//   "not referenced" hint and the user wires it by hand.
// NEVER destructive: a non-empty state (plain string, unparseable text,
// non-chat array, arbitrary object) is preserved and at most gets the
// placeholder appended — only an empty editor is replaced by the bare
// placeholder string.
const injectPlaceholderIntoState = (
  stateJson: string,
  placeholder: string
): string => {
  const trimmed = stateJson.trim();
  if (!trimmed || trimmed === '{}' || trimmed === '[]') {
    return JSON.stringify(placeholder);
  }
  let parsed: any = null;
  let parseable = true;
  try {
    parsed = JSON.parse(stateJson);
  } catch {
    parseable = false;
  }
  if (parseable) {
    if (Array.isArray(parsed) && parsed.length > 0) {
      const last = parsed[parsed.length - 1];
      if (
        _.isPlainObject(last) &&
        typeof last.content === 'string' &&
        typeof last.role === 'string'
      ) {
        parsed = [...parsed];
        parsed[parsed.length - 1] = {
          ...last,
          content: last.content ? `${last.content} ${placeholder}` : placeholder
        };
        return JSON.stringify(parsed, null, 2);
      }
      // A valid non-chat array is user data — leave it untouched (the asset
      // shows the not-referenced hint until wired by hand).
      return stateJson;
    }
    if (typeof parsed === 'string') {
      return JSON.stringify(`${parsed} ${placeholder}`);
    }
    // Arbitrary object: nothing sensible to append to — leave as is.
    return stateJson;
  }
  // Unparseable non-empty text: append the placeholder to the raw text so
  // no user input is lost.
  return `${stateJson}\n${placeholder}`;
};

// NOTE: deleting an asset intentionally does NOT edit either editor's
// text. Stripping the placeholder automatically sounds nice but requires
// JSON-aware surgical edits (keys vs values, escapes, token boundaries,
// formatting) whose failure modes corrupt user input — far worse than a
// leftover literal token, which the engine simply passes through as text.
// The not-referenced hint already tells the user what to clean up by hand.

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
  // ConfigProvider-aware message API (plain antd `message` would ignore the
  // app theme / dark mode — the layout wires the App provider for exactly
  // this).
  const { message } = App.useApp();
  const { isDarkTheme } = useUserSettings();
  const [searchParams] = useSearchParams();
  const requestSource = useRequestToken();
  const requestToken = useRef<any>(null);
  const formRef = useRef<any>(null);
  const workspaceRef = useRef<DecisionWorkspaceHandle>(null);

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
  // Uploaded images: base64 payloads + their referencing placeholders. They
  // ride the request as `assets` (and a top-level `images` array for
  // upstream vLLM — see buildImageRequest), never stored server-side.
  const [images, setImages] = useState<DecisionImage[]>([]);
  // Latest-commit mirrors for the async upload callback (file reading +
  // debounce can resolve after edits/deletions; snapshots captured at call
  // time would clobber that newer state).
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const stateJsonRef = useRef(stateJson);
  stateJsonRef.current = stateJson;

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

  // ============ Image asset wiring (issue #6622) ============

  // All placeholders referenced by either editor. The scan works on PARSED
  // VALUES, not raw text: object keys are skipped (a question id of "img-1"
  // is not a reference) and JSON escapes are already decoded (so
  // "\u0069mg-1" counts). Unparseable text falls back to a raw scan — the
  // injection itself appends to raw text in that case. One pass per editor
  // change; lookups below are O(1) Set hits.
  const collectReferencedPlaceholders = (value: any, set: Set<string>) => {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/\bimg-\d+\b/g)) {
        set.add(match[0]);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item) => collectReferencedPlaceholders(item, set));
    } else if (_.isPlainObject(value)) {
      Object.values(value).forEach((item) =>
        collectReferencedPlaceholders(item, set)
      );
    }
  };
  const referencedImages = useMemo(() => {
    const set = new Set<string>();
    const collectFrom = (text: string) => {
      try {
        collectReferencedPlaceholders(JSON.parse(text), set);
      } catch {
        for (const match of text.matchAll(/\bimg-\d+\b/g)) {
          set.add(match[0]);
        }
      }
    };
    collectFrom(stateJson);
    collectFrom(questionsJson);
    return set;
  }, [stateJson, questionsJson]);

  const isImageReferenced = (placeholder: string) =>
    referencedImages.has(placeholder);

  // ALL placeholder tokens present anywhere in the editors — keys AND
  // values, parsed (so escaped forms count). Used to steer placeholder
  // allocation away from in-use names; reference detection above is the
  // stricter values-only view.
  const usedPlaceholderTokens = useMemo(() => {
    const set = new Set<string>();
    const walk = (value: any) => {
      if (typeof value === 'string') {
        for (const match of value.matchAll(/\bimg-\d+\b/g)) {
          set.add(match[0]);
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => walk(item));
      } else if (_.isPlainObject(value)) {
        // Keys AND values: allocation must avoid both (a key named img-1
        // would be shadowed by a new upload).
        Object.entries(value).forEach(([key, item]) => {
          walk(key);
          walk(item);
        });
      }
    };
    const collect = (text: string) => {
      try {
        walk(JSON.parse(text));
      } catch {
        for (const match of text.matchAll(/\bimg-\d+\b/g)) {
          set.add(match[0]);
        }
      }
    };
    collect(stateJson);
    collect(questionsJson);
    return set;
  }, [stateJson, questionsJson]);

  const handleUploadImages = (imgList: { dataUrl: string }[]) => {
    if (!imgList?.length) {
      return;
    }
    const added: DecisionImage[] = [];
    // Placeholders are allocated against the LATEST parsed token set (refs
    // + memo): the set starts from every img-N in either editor (keys and
    // values, escaped forms included) plus live image placeholders, then
    // grows with each allocation in this batch. The state injection runs
    // against the latest committed state; the image list merges
    // functionally so a deletion made in between is preserved.
    const used = new Set([
      ...imagesRef.current.map((image) => image.placeholder),
      ...usedPlaceholderTokens
    ]);
    let nextStateJson = stateJsonRef.current;
    for (const item of imgList) {
      const placeholder = nextImagePlaceholder(used);
      used.add(placeholder);
      added.push({ placeholder, dataUrl: item.dataUrl });
      nextStateJson = injectPlaceholderIntoState(nextStateJson, placeholder);
    }
    setImages((current) => [...current, ...added]);
    setStateJson(nextStateJson);
  };

  // Deleting an image removes ONLY the tray entry — the editors' text is
  // never edited (see the note above stripPlaceholderFromText's old spot).
  // If the questions still reference a deleted placeholder, warn instead:
  // the leftover token is harmless to the engine, but the questions may no
  // longer ask what the user intends.
  const warnIfStillReferenced = (placeholders: string[]) => {
    const stillReferenced = placeholders.filter((placeholder) =>
      new RegExp(`\\b${_.escapeRegExp(placeholder)}\\b`).test(questionsJson)
    );
    if (stillReferenced.length > 0) {
      message.warning(
        intl.formatMessage(
          { id: 'playground.decision.assets.deletedStillReferenced' },
          { placeholders: stillReferenced.join(', ') }
        )
      );
    }
  };

  const handleDeleteImage = (placeholder: string) => {
    setImages(images.filter((image) => image.placeholder !== placeholder));
    warnIfStillReferenced([placeholder]);
  };

  // The request payload for the uploaded images (issue #6622 items 3 & 6):
  // - `assets` — the TypeSafe placeholder map, the only way TypeSafe-hosted
  //   and vllm-sr engines read images (and the only way to scope one to a
  //   single question/option); values carry raw base64 in `data_base64`;
  // - top-level `images` — the only field upstream vLLM (>= 0.32) reads.
  //   Unlike `assets`, its entries must be FULL data URLs
  //   ("data:image/png;base64,..." — a raw payload is rejected with
  //   "media must be data URLs"), so the original data URL is reused.
  const buildImageRequest = () => {
    const assets: Record<string, any> = {};
    const topLevelImages: string[] = [];
    for (const image of images) {
      const parts = splitDataUrl(image.dataUrl);
      if (!parts) {
        continue;
      }
      assets[image.placeholder] = {
        type: 'image',
        format: parts.format,
        data_base64: parts.dataBase64
      };
      topLevelImages.push(image.dataUrl);
    }
    return { assets, topLevelImages };
  };

  const viewCodeContent = useMemo(() => {
    const { value: state } = parseStateJson();
    const { body } = parseQuestionsJson();
    const { assets, topLevelImages } = buildImageRequest();
    const codeParameters: Record<string, any> = {
      state: state ?? '',
      questions: body || {},
      model: parameters.model || ''
    };
    // Readability stub: real base64 payloads would bury the sample. The
    // `images` stub keeps each data URL's MIME prefix — a non-data-URL
    // entry fails vLLM's media validation if the sample is copied as-is.
    if (Object.keys(assets).length > 0) {
      codeParameters.assets = _.mapValues(assets, (asset: any) => ({
        ...asset,
        data_base64: '<base64-image-data>'
      }));
      codeParameters.images = topLevelImages.map((dataUrl) =>
        dataUrl.replace(
          /^(data:image\/[a-z0-9.+-]+;base64,).*/,
          '$1<base64-image-data>'
        )
      );
    }
    return generateDecisionCode({
      api: SYSTEMONE_API,
      parameters: codeParameters,
      headers:
        Object.keys(assets).length > 0
          ? [['TypeSafe-Danger-Zone-Images', 'true']]
          : []
    });
  }, [parameters.model, stateJson, questionsJson, images]);

  const handleCloseViewCode = () => {
    setShow(false);
  };

  // Per-editor resets: each editor goes back to its sample half (an empty
  // editor teaches nothing); answers belong to the run and stay untouched.
  const handleClearState = () => {
    const sample = decisionSamples[intl.locale] || decisionSamples['en-US'];
    setStateJson(JSON.stringify(sample?.state ?? {}, null, 2));
    setError(null);
  };
  const handleClearQuestions = () => {
    const sample = decisionSamples[intl.locale] || decisionSamples['en-US'];
    setQuestionsJson(sample ? buildSampleQuestions(sample) : '{}');
    setError(null);
  };
  // Bulk remove: empty the tray only; editors' text is intentionally left
  // untouched (see the note by the asset wiring section) — a warning fires
  // for any placeholder the questions still reference.
  const handleClearAssets = () => {
    warnIfStillReferenced(images.map((image) => image.placeholder));
    setImages([]);
  };

  // Re-indent an editor's content — the usual rescue after pasting
  // minified JSON from a curl example or an SDK log.
  const formatJsonText = (
    text: string,
    setText: (v: string) => void,
    errorId: string
  ) => {
    try {
      setText(JSON.stringify(JSON.parse(text), null, 2));
      setError(null);
    } catch (e: any) {
      setError(
        intl.formatMessage({ id: errorId }, { message: e?.message || '' })
      );
    }
  };
  const handleFormatState = () =>
    formatJsonText(
      stateJson,
      setStateJson,
      'playground.decision.state.invalidJson'
    );
  const handleFormat = () =>
    formatJsonText(
      questionsJson,
      setQuestionsJson,
      'playground.decision.questions.invalidJson'
    );

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
    workspaceRef.current?.showAnswers();
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
      const requestBody: { model: string; [key: string]: any } = {
        state,
        questions: body,
        model: parameters.model
      };
      // Images ride both `assets` and a top-level `images` array (one body
      // shape for TypeSafe-hosted, vllm-sr, and upstream vLLM engines).
      const { assets, topLevelImages } = buildImageRequest();
      const withImages = Object.keys(assets).length > 0;
      if (withImages) {
        requestBody.assets = assets;
        requestBody.images = topLevelImages;
      }
      // The opt-in image header, attached whenever assets are present
      // (issue #6622 item 3); the gateway passes it through.
      const imageHeaders = withImages
        ? { 'TypeSafe-Danger-Zone-Images': 'true' }
        : undefined;
      const res: any = await decisionQuery(requestBody, {
        cancelToken: token.token,
        headers: imageHeaders
      });
      if (!isCurrent()) {
        return;
      }
      setAnswers(res?.answers || {});
      setMeta(res ?? null);
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
        <DecisionWorkspace
          ref={workspaceRef}
          loading={loading}
          runBlockReason={runBlockReason}
          onRun={handleSubmit}
          onStop={handleStop}
          answersEmpty={!loading && !answers && !error}
          answerUsage={
            meta?.usage &&
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
            )
          }
          answers={
            <div>
              {error && (
                <div className="m-b-8">
                  <AlertInfo type="danger" message={error}></AlertInfo>
                </div>
              )}

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
                <span style={{ color: 'var(--ant-color-text-secondary)' }}>
                  {intl.formatMessage({
                    id: 'playground.decision.answers.empty'
                  })}
                </span>
              )}
              {!loading && !answers && !error && (
                <span className="decision-answer-placeholder">
                  {intl.formatMessage({
                    id: 'playground.decision.answers.placeholder'
                  })}
                </span>
              )}
            </div>
          }
        >
          <Flex component="div" vertical className="decision-input-region">
            {/* PoC layout: state and questions editors SIDE BY SIDE, the
                uploaded images in a horizontal tray BELOW both. */}
            <Flex className="editors-row">
              <Flex vertical className="editor-panel">
                <Flex
                  component="div"
                  justify="space-between"
                  align="center"
                  className="editor-header"
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
                  <Flex
                    align="center"
                    justify="end"
                    gap="small"
                    wrap
                    className="editor-actions"
                  >
                    <Button
                      size="small"
                      icon={<IconFont type="icon-object" />}
                      disabled={loading}
                      onClick={handleFormatState}
                    >
                      {intl.formatMessage({
                        id: 'playground.decision.questions.format'
                      })}
                    </Button>
                    <Tooltip
                      title={intl.formatMessage({
                        id: 'common.button.clear'
                      })}
                    >
                      <Button
                        size="small"
                        icon={<ClearOutlined />}
                        disabled={loading}
                        onClick={handleClearState}
                        aria-label={intl.formatMessage({
                          id: 'common.button.clear'
                        })}
                        title={intl.formatMessage({
                          id: 'common.button.clear'
                        })}
                      />
                    </Tooltip>
                  </Flex>
                </Flex>
                {/* Editor body only — uploads live in the Assets panel below
                  (assets are a peer of state/questions in the System One
                  contract, referenced by placeholder from BOTH editors). */}
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
              </Flex>

              <Flex vertical className="editor-panel questions-editor-wrap">
                <Flex
                  component="div"
                  justify="space-between"
                  align="center"
                  className="editor-header"
                >
                  <h3 className="m-b-0 font-size-14 line-24 font-500">
                    {intl.formatMessage({
                      id: 'playground.decision.questions'
                    })}
                  </h3>
                  <Flex
                    align="center"
                    justify="end"
                    gap="small"
                    wrap
                    className="editor-actions"
                  >
                    {Object.keys(QUESTION_TEMPLATES).map((type) => (
                      <Tooltip key={type} title={type}>
                        <Button
                          size="small"
                          disabled={loading || !questionsParsable}
                          onClick={() => handleInsertTemplate(type)}
                        >
                          <PlusOutlined />
                          {intl.formatMessage({
                            id: `playground.decision.questions.type.${type}`
                          })}
                        </Button>
                      </Tooltip>
                    ))}
                    <Button
                      size="small"
                      icon={<IconFont type="icon-object" />}
                      disabled={loading || !questionsParsable}
                      onClick={handleFormat}
                    >
                      {intl.formatMessage({
                        id: 'playground.decision.questions.format'
                      })}
                    </Button>
                    <Tooltip
                      title={intl.formatMessage({
                        id: 'common.button.clear'
                      })}
                    >
                      <Button
                        size="small"
                        icon={<ClearOutlined />}
                        disabled={loading}
                        onClick={handleClearQuestions}
                        aria-label={intl.formatMessage({
                          id: 'common.button.clear'
                        })}
                        title={intl.formatMessage({
                          id: 'common.button.clear'
                        })}
                      />
                    </Tooltip>
                  </Flex>
                </Flex>
                {/* Schema-guided JSON editing: autocomplete/hover/validation for
                the known question shape (scoped to this model's path), with
                template inserts and formatting above. The editor fills the
                remaining input height; syntax errors are marked inline by
                monaco and reflected live in the run bar below. */}
                <div className="questions-editor">
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
            </Flex>
            {/* Assets panel (System One contract): a peer of state/questions —
                uploaded images live here and are referenced by placeholder
                from strings in BOTH editors (state, instructions, criteria).
                Always visible; the upload affordance lives in its header. */}
            <Flex vertical className="assets-panel">
              <Flex
                component="div"
                justify="space-between"
                align="center"
                className="editor-header"
              >
                <h3 className="m-b-0 font-size-14 line-24 font-500">
                  {intl.formatMessage({ id: 'playground.decision.assets' })}
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'playground.decision.assets.tooltip'
                    })}
                  >
                    <QuestionCircleOutlined className="m-l-4" />
                  </Tooltip>
                </h3>
                <Flex
                  align="center"
                  justify="end"
                  gap="small"
                  wrap
                  className="editor-actions"
                >
                  <UploadImg
                    handleUpdateImgList={handleUploadImages}
                    multiple
                    size="small"
                  >
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      disabled={loading}
                    >
                      {intl.formatMessage({
                        id: 'playground.decision.images.upload'
                      })}
                    </Button>
                  </UploadImg>
                  <Tooltip
                    title={intl.formatMessage({ id: 'common.button.clear' })}
                  >
                    <Button
                      size="small"
                      icon={<ClearOutlined />}
                      disabled={loading || images.length === 0}
                      onClick={handleClearAssets}
                      aria-label={intl.formatMessage({
                        id: 'common.button.clear'
                      })}
                      title={intl.formatMessage({
                        id: 'common.button.clear'
                      })}
                    />
                  </Tooltip>
                </Flex>
              </Flex>
              <div className="decision-images-strip assets-flow">
                {images.length > 0 ? (
                  images.map((image) => {
                    const referenced = isImageReferenced(image.placeholder);
                    return (
                      <div key={image.placeholder} className="image-item">
                        <div className="thumb-image-wrap">
                          <ThumbImg
                            dataList={[
                              {
                                uid: image.placeholder,
                                dataUrl: image.dataUrl,
                                height: 96
                              }
                            ]}
                            editable
                            onDelete={(uid) => handleDeleteImage(String(uid))}
                          />
                        </div>
                        <span className="image-caption">
                          <span className="caption-state">
                            {!referenced && (
                              <Tooltip
                                title={intl.formatMessage({
                                  id: 'playground.decision.images.notReferenced'
                                })}
                              >
                                <span className="thumb-unref-dot" />
                              </Tooltip>
                            )}
                          </span>
                          <span
                            className="caption-name"
                            title={image.placeholder}
                          >
                            {image.placeholder}
                          </span>
                          {/* core-ui CopyButton: secure-context clipboard with
                              an execCommand fallback, so copying also works
                              on plain-HTTP intranet pages. */}
                          <CopyButton
                            text={image.placeholder}
                            type="text"
                            size="small"
                            tips={intl.formatMessage({
                              id: 'playground.decision.images.copyPlaceholder'
                            })}
                            btnStyle={{ padding: 0, fontSize: '11px' }}
                          />
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <span className="assets-empty">
                    {intl.formatMessage({
                      id: 'playground.decision.assets.empty'
                    })}
                  </span>
                )}
              </div>
            </Flex>
          </Flex>
        </DecisionWorkspace>
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
