import IconFont from '@/components/icon-font';
import {
  ApiOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExperimentOutlined,
  RetweetOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import React from 'react';

const icons = {
  EditOutlined: React.createElement(EditOutlined),
  ExperimentOutlined: React.createElement(ExperimentOutlined),
  DeleteOutlined: React.createElement(DeleteOutlined),
  ThunderboltOutlined: React.createElement(ThunderboltOutlined),
  RetweetOutlined: React.createElement(RetweetOutlined),
  DownloadOutlined: React.createElement(DownloadOutlined),
  ApiOutlined: React.createElement(ApiOutlined),
  Stop: React.createElement(IconFont, { type: 'icon-stop1' }),
  Play: React.createElement(IconFont, { type: 'icon-outline-play' }),
  Catalog: React.createElement(IconFont, { type: 'icon-catalog' }),
  HF: React.createElement(IconFont, { type: 'icon-huggingface' }),
  Ollama: React.createElement(IconFont, { type: 'icon-ollama' }),
  ModelScope: React.createElement(IconFont, { type: 'icon-tu2' }),
  LocalPath: React.createElement(IconFont, { type: 'icon-hard-disk' }),
  Launch: React.createElement(IconFont, { type: 'icon-rocket-launch' }),
  Deployment: React.createElement(IconFont, { type: 'icon-rocket-launch1' })
};

export default icons;
