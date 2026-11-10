import { AlertInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useRef, useState } from 'react';
import useImageRouteCache from '../../hooks/use-image-route-cache';
import ComparisonWorkspace from './components/comparison-workspace';
import ImageCompareInput from './components/image-compare-input';
import ImageModelPanel from './components/image-model-panel';
import { imageParameterLabels, imageSharedFields } from './config';
import { ImageComparisonHandle } from './config/types';
import useImageComparison from './hooks/use-image-comparison';

interface ImageCompareProps {
  modelList: Global.BaseOption<string>[];
  loaded: boolean;
}

export default function ImageCompare({ modelList, loaded }: ImageCompareProps) {
  const intl = useIntl();
  const setRunning = useImageRouteCache();
  const running = useRef(false);
  const preparing = useRef(false);
  const batch = useRef(0);
  const [prompt, setPrompt] = useState('');
  const [validating, setValidating] = useState(false);
  const [syncError, setSyncError] = useState('');
  const comparison = useImageComparison(modelList, (loading) => {
    running.current = loading;
    setRunning(loading);
  });

  const handleSubmit = async (content: string) => {
    if (preparing.current || running.current || !content.trim()) return;
    preparing.current = true;
    setValidating(true);
    const currentBatch = ++batch.current;
    const panels: ImageComparisonHandle[] = [];
    comparison.forEachPanel((panel) => panels.push(panel));
    try {
      const runs = await Promise.allSettled(
        panels.map((panel) => panel.prepare(content))
      );
      if (
        currentBatch !== batch.current ||
        runs.some((run) => run.status === 'rejected' || run.value === false)
      )
        return;
      const activePanels = new Map<symbol, ImageComparisonHandle>();
      comparison.forEachPanel((panel) =>
        activePanels.set(panel.instanceId, panel)
      );
      runs.forEach((run, index) => {
        if (run.status === 'fulfilled' && run.value)
          activePanels.get(panels[index].instanceId)?.submit(run.value);
      });
    } finally {
      if (currentBatch === batch.current) {
        preparing.current = false;
        setValidating(false);
      }
    }
  };

  const stop = () => {
    batch.current += 1;
    preparing.current = false;
    setValidating(false);
    comparison.handleAbortFetch();
  };

  const clear = () => {
    stop();
    comparison.handleClearAll();
    setSyncError('');
  };

  const applyParameters = (values: Record<string, any>) => {
    const shared = _.pick(values, imageSharedFields);
    const targets: ImageComparisonHandle[] = [];
    comparison.forEachPanel((panel) => {
      if (panel.getParameters().model) targets.push(panel);
    });
    const errors = targets.flatMap((panel) => {
      const fields = panel.validateParameters(shared);
      return fields.length
        ? [
            `${panel.getParameters().model} (${fields.map((field) => intl.formatMessage({ id: imageParameterLabels[field] })).join(', ')})`
          ]
        : [];
    });
    if (errors.length) {
      setSyncError(
        intl.formatMessage(
          { id: 'playground.image.compare.applyFailed' },
          { models: errors.join('; ') }
        )
      );
      return;
    }
    setSyncError('');
    targets.forEach((panel) => panel.applyParameters(shared));
  };

  return (
    <ComparisonWorkspace
      layout={comparison.layout}
      modelSelections={comparison.modelSelections}
      loaded={loaded}
      renderPanel={(model) => (
        <ImageModelPanel
          ref={(panel) => comparison.setModelRef(model.instanceId, panel)}
          instanceId={model.instanceId}
          model={model.value}
          modelList={modelList}
          prompt={prompt}
          canDelete={comparison.modelSelections.length > 2}
          onDelete={comparison.handleDeleteModel}
          onLoadingChange={comparison.setLoadingStatus}
          onApplyParameters={applyParameters}
        />
      )}
      footer={
        <>
          {syncError && <AlertInfo type="danger" message={syncError} />}
          <ImageCompareInput
            prompt={prompt}
            running={comparison.isLoading}
            disabled={validating || !modelList.length}
            layout={comparison.layout}
            onChange={setPrompt}
            onSubmit={handleSubmit}
            onStop={stop}
            onClear={clear}
            onLayoutChange={comparison.updateLayout}
          />
        </>
      }
    />
  );
}
