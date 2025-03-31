const MODEL_EVALUATIONS = '/model-evaluations';

let controller = new AbortController();
let signal = controller.signal;

self.onmessage = async (event) => {
  const { list, modelSource, modelSourceMap } = event.data;

  const repoList = list.map((item: any) => ({
    source: modelSource,
    ...(modelSource === modelSourceMap.huggingface_value
      ? { huggingface_repo_id: item.name }
      : { model_scope_model_id: item.name })
  }));

  try {
    controller?.abort();
    controller = new AbortController();
    signal = controller.signal;
    const response = await fetch(`v1/${MODEL_EVALUATIONS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal,
      body: JSON.stringify({ model_specs: repoList })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const evaluations = await response.json();
    const { results } = evaluations;
    const resultList = list.map((item: any, index: number) => {
      return {
        ...item,
        evaluateResult: results[index] || null
      };
    });

    self.postMessage({ success: true, resultList });
  } catch (error) {
    self.postMessage({ success: false, resultList: list });
  }
};

self.onmessage = (event) => {
  if (event.data === 'abort') {
    controller.abort();
  }
};
