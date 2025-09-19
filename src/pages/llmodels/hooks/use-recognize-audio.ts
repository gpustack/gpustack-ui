import {
  HuggingFaceTaskMap,
  ModelscopeTaskMap,
  modelSourceMap,
  modelTaskMap
} from '../config';
import { HuggingFaceModels, ModelScopeModels } from '../config/audio-catalog';

export default function useRecognizeAudio() {
  const checkModelName = (
    modelName: string,
    item: { type: string; org: string; name: string }
  ) => {
    let sourceName = `${item.org}/${item.name}`;
    if (item.name === '*') {
      sourceName = `${item.org}`;
    }
    return (
      `${sourceName}`.indexOf(modelName) > -1 ||
      modelName?.indexOf(`${sourceName}`) > -1
    );
  };

  const identifyModelTask = (source: string, modelName: string) => {
    let data = null;
    if (source === modelSourceMap.huggingface_value) {
      data = HuggingFaceModels.find((item) => checkModelName(modelName, item));
    }
    if (source === modelSourceMap.modelscope_value) {
      data = ModelScopeModels.find((item) => checkModelName(modelName, item));
    }
    if (data) {
      return modelTaskMap.audio;
    }
    return '';
  };

  const recognizeAudioModel = (selectModel: any, source: string) => {
    const modelTaskType = identifyModelTask(source, selectModel.name);
    let isAudio = modelTaskType === modelTaskMap.audio;

    // Check if the model is audio type, if not, check if the task is audio
    if (!isAudio) {
      const modelTask =
        HuggingFaceTaskMap.audio.includes(selectModel.task) ||
        ModelscopeTaskMap.audio.includes(selectModel.task)
          ? modelTaskMap.audio
          : '';

      isAudio = modelTask === modelTaskMap.audio;
    }

    const modelTaskData = {
      value: selectModel.task,
      type: isAudio ? modelTaskMap.audio : '',
      isAudio: isAudio,
      text2speech:
        HuggingFaceTaskMap[modelTaskMap.textToSpeech] === selectModel.task ||
        ModelscopeTaskMap[modelTaskMap.textToSpeech] === selectModel.task,
      speech2text:
        HuggingFaceTaskMap[modelTaskMap.speechToText] === selectModel.task ||
        ModelscopeTaskMap[modelTaskMap.speechToText] === selectModel.task
    };
    return modelTaskData;
  };

  return {
    identifyModelTask,
    recognizeAudioModel
  };
}
