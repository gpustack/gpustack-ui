import GPUStackLogo from '@/assets/images/small-logo-200x200.png';
import ai360 from '@/assets/providers-logo/ai360.svg';
import azure from '@/assets/providers-logo/azureai.svg';
import baichuan from '@/assets/providers-logo/baichuan.svg';
import baiduCloud from '@/assets/providers-logo/baiducloud.svg';
import bedrock from '@/assets/providers-logo/bedrock.svg';
import claude from '@/assets/providers-logo/claude.svg';
import cloudflare from '@/assets/providers-logo/cloudflare.svg';
import cohere from '@/assets/providers-logo/cohere.svg';
import coze from '@/assets/providers-logo/coze.svg';
import deepl from '@/assets/providers-logo/deepl.svg';
import deepseek from '@/assets/providers-logo/deepseek.svg';
import dify from '@/assets/providers-logo/dify.svg';
import doubao from '@/assets/providers-logo/doubao.svg';
import fireworks from '@/assets/providers-logo/fireworks.svg';
import gemini from '@/assets/providers-logo/gemini.svg';
import github from '@/assets/providers-logo/github.svg';
import grok from '@/assets/providers-logo/grok.svg';
import groq from '@/assets/providers-logo/groq.svg';
import hunyuan from '@/assets/providers-logo/hunyuan.svg';
import longcat from '@/assets/providers-logo/longcat.svg';
import minimax from '@/assets/providers-logo/minimax.svg';
import mistral from '@/assets/providers-logo/mistral.svg';
import moonshot from '@/assets/providers-logo/moonshot.svg';
import triton from '@/assets/providers-logo/nvidia.svg';
import ollama from '@/assets/providers-logo/ollama.svg';
import openai from '@/assets/providers-logo/openai.svg';
import openrouter from '@/assets/providers-logo/openrouter.svg';
import qwen from '@/assets/providers-logo/qwen.svg';
import spark from '@/assets/providers-logo/spark.svg';
import stepfun from '@/assets/providers-logo/stepfun.svg';
import togetherai from '@/assets/providers-logo/together.svg';
import yi from '@/assets/providers-logo/yi.svg';
import zhipuai from '@/assets/providers-logo/zhipu.svg';
import { ProviderEnum } from '../config/providers';

const ProviderLogoMap: Record<string, string> = {
  [ProviderEnum.BAIDU]: baiduCloud,
  [ProviderEnum.FIREWORKS]: fireworks,
  [ProviderEnum.GEMINI]: gemini,
  [ProviderEnum.YI]: yi,
  [ProviderEnum.AI360]: ai360,
  [ProviderEnum.AZURE]: azure,
  [ProviderEnum.BAICHUAN]: baichuan,
  [ProviderEnum.BEDROCK]: bedrock,
  [ProviderEnum.CLAUDE]: claude,
  [ProviderEnum.CLOUDFLARE]: cloudflare,
  [ProviderEnum.COHERE]: cohere,
  [ProviderEnum.COZE]: coze,
  [ProviderEnum.DEEPL]: deepl,
  [ProviderEnum.DEEPSEEK]: deepseek,
  [ProviderEnum.DIFY]: dify,
  [ProviderEnum.DOUBAO]: doubao,
  [ProviderEnum.GROK]: grok,
  [ProviderEnum.GROQ]: groq,
  [ProviderEnum.HUNYUAN]: hunyuan,
  [ProviderEnum.LONGCAT]: longcat,
  [ProviderEnum.MINIMAX]: minimax,
  [ProviderEnum.MISTRAL]: mistral,
  [ProviderEnum.MOONSHOT]: moonshot,
  [ProviderEnum.OLLAMA]: ollama,
  [ProviderEnum.OPENAI]: openai,
  [ProviderEnum.OPENROUTER]: openrouter,
  [ProviderEnum.QWEN]: qwen,
  [ProviderEnum.SPARK]: spark,
  [ProviderEnum.STEPFUN]: stepfun,
  [ProviderEnum.TOGETHERAI]: togetherai,
  [ProviderEnum.ZHIPUAI]: zhipuai,
  [ProviderEnum.GITHUB]: github,
  [ProviderEnum.TRITON]: triton,
  ['deployments']: GPUStackLogo
};

const ProviderLogo: React.FC<{
  provider: string;
  style?: React.CSSProperties;
}> = ({ provider, style }) => {
  const logoSrc = ProviderLogoMap[provider] || '';
  return (
    <img
      src={logoSrc}
      alt={`${provider} logo`}
      style={{ width: 16, height: 16, ...style }}
    />
  );
};

export default ProviderLogo;
