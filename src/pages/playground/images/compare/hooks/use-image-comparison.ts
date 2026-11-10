import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import {
  ImageComparisonHandle,
  ImageComparisonLayout,
  ImageModelSelection
} from '../config/types';

type ModelOption = Global.BaseOption<string> & { type?: string };

interface ComparisonState {
  layout: ImageComparisonLayout;
  modelSelections: ImageModelSelection[];
  loadingStatus: Record<symbol, boolean>;
}

export default function useImageComparison(
  modelList: ModelOption[],
  onLoadingChange?: (loading: boolean) => void
) {
  const [state, setState] = useState<ComparisonState>({
    layout: { span: 12, count: 2 },
    modelSelections: [],
    loadingStatus: {}
  });
  const panelRefs = useRef(new Map<symbol, ImageComparisonHandle>());
  const activeInstances = useRef(new Set<symbol>());
  const modelCounts = useRef(new Map<string, number>());
  const runningInstances = useRef(new Set<symbol>());

  const createSelection = (model: ModelOption): ImageModelSelection => {
    const key = model.value || 'empty';
    const uid = (modelCounts.current.get(key) || 0) + 1;
    modelCounts.current.set(key, uid);
    return { ...model, uid, instanceId: Symbol(key) };
  };

  const updateSelections = (
    modelSelections: ImageModelSelection[],
    layout: ImageComparisonLayout
  ) => {
    const instances = new Set(modelSelections.map((model) => model.instanceId));
    activeInstances.current = instances;
    runningInstances.current.forEach((instanceId) => {
      if (!instances.has(instanceId))
        runningInstances.current.delete(instanceId);
    });
    panelRefs.current.forEach((panel, instanceId) => {
      if (!instances.has(instanceId)) {
        panel.abortFetch();
        panelRefs.current.delete(instanceId);
      }
    });
    onLoadingChange?.(runningInstances.current.size > 0);
    setState((previous) => ({
      layout,
      modelSelections,
      loadingStatus: Object.fromEntries(
        modelSelections.map(({ instanceId }) => [
          instanceId,
          previous.loadingStatus[instanceId] || false
        ])
      )
    }));
  };

  const fillSelections = (models: ImageModelSelection[], count: number) => {
    const selections = models.slice(0, count);
    while (selections.length < count) {
      const model = modelList[selections.length] || {
        label: '',
        value: '',
        type: 'empty'
      };
      selections.push(createSelection(model));
    }
    return selections;
  };

  const updateLayout = (layout: ImageComparisonLayout) => {
    const selections = modelList.length
      ? fillSelections(state.modelSelections, layout.count)
      : [];
    updateSelections(selections, layout);
  };

  const handleDeleteModel = (instanceId: symbol) => {
    if (state.modelSelections.length <= 2) return;
    const selections = state.modelSelections.filter(
      (model) => model.instanceId !== instanceId
    );
    updateSelections(selections, {
      span: selections.length % 2 === 0 ? 12 : 8,
      count: selections.length
    });
  };

  const setModelRef = useMemoizedFn(
    (instanceId: symbol, panel: ImageComparisonHandle | null) => {
      if (panel && activeInstances.current.has(instanceId)) {
        panelRefs.current.set(instanceId, panel);
      } else {
        panelRefs.current.delete(instanceId);
      }
    }
  );

  const setLoadingStatus = useMemoizedFn(
    (instanceId: symbol, loading: boolean) => {
      if (!activeInstances.current.has(instanceId)) return;
      if (loading) runningInstances.current.add(instanceId);
      else runningInstances.current.delete(instanceId);
      onLoadingChange?.(runningInstances.current.size > 0);
      setState((previous) => ({
        ...previous,
        loadingStatus: { ...previous.loadingStatus, [instanceId]: loading }
      }));
    }
  );

  const forEachPanel = (action: (panel: ImageComparisonHandle) => void) => {
    panelRefs.current.forEach(action);
  };

  const handleAbortFetch = () => {
    forEachPanel((panel) => panel.abortFetch());
  };

  const handleClearAll = () => {
    forEachPanel((panel) => panel.clear());
  };

  useEffect(() => {
    const selections = modelList.length
      ? fillSelections([], state.layout.count)
      : [];
    updateSelections(selections, state.layout);
  }, [modelList]);

  return {
    ...state,
    isLoading: state.modelSelections.some(
      ({ instanceId }) => state.loadingStatus[instanceId]
    ),
    updateLayout,
    handleDeleteModel,
    setModelRef,
    setLoadingStatus,
    forEachPanel,
    handleAbortFetch,
    handleClearAll
  };
}
