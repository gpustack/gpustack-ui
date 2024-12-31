export default [
  {
    name: 'gpustack/bge-m3-GGUF',
    tags: ['Embedding', 'GGUF', 'bert'],
    description:
      'It can simultaneously perform the three common retrieval functionalities of embedding model: dense retrieval, multi-vector retrieval, and sparse retrieval.',
    size: ['567M']
  },
  {
    name: 'gpustack/stable-diffusion-v3-5-medium-GGUF',
    tags: ['Text-to-Image', 'GGUF'],
    description:
      'Stable Diffusion 3.5 Medium is a Multimodal Diffusion Transformer with improvements (MMDiT-X) text-to-image model that features improved performance in image quality, typography, complex prompt understanding, and resource-efficiency.',
    size: ['8B']
  },
  {
    name: 'gpustack/stable-diffusion-v3-5-large-GGUF',
    tags: ['Text-to-Image', 'GGUF'],
    description:
      'Stable Diffusion 3.5 Large is a Multimodal Diffusion Transformer (MMDiT) text-to-image model that features improved performance in image quality, typography, complex prompt understanding, and resource-efficiency',
    size: ['14B']
  },
  {
    name: 'gpustack/jina-reranker-v1-tiny-en-GGUF',
    tags: ['Rerank', 'GGUF', 'jina-bert-v2'],
    description:
      'his model is designed for blazing-fast reranking while maintaining competitive performance.',
    size: ['Q8_0', 'Q4_0']
  },
  {
    name: 'gpustack/stable-diffusion-v1-5-inpainting-GGUF',
    tags: ['Text-to-Image', 'GGUF'],
    description:
      'Stable Diffusion Inpainting is a latent text-to-image diffusion model capable of generating photo-realistic images given any text input, with the extra capability of inpainting the pictures by using a mask',
    size: ['1B', 'Q8_0', 'Q4_0']
  },
  {
    name: 'gpustack/Llama-3.2-3B-Instruct-GGUF',
    tags: ['Text-to-Text', 'GGUF', 'llama'],
    description:
      'The Llama 3.2 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction-tuned generative models in 1B and 3B sizes (text in/text out).',
    size: ['1B', 'Q8_0', 'Q4_0']
  },
  {
    name: 'gpustack/faster-whisper-large-v1',
    description:
      'This model can be used in CTranslate2 or projects based on CTranslate2 such as faster-whisper.',
    tags: ['Speech-to-Text'],
    size: []
  },
  {
    name: 'gpustack/faster-distil-whisper-medium.en',
    description:
      'This model can be used in CTranslate2 or projects based on CTranslate2 such as faster-whisper.',
    tags: ['Speech-to-Text']
  },
  {
    name: 'gpustack/CosyVoice-300M',
    description:
      'This model is a lightweight, fast, and efficient text-to-speech model that can be used in various applications.',
    tags: ['Text-to-Speech']
  },
  {
    name: 'gpustack/FLUX.1-mini-GGUF',
    tags: ['Text-to-Image', 'GGUF'],
    description:
      'A 3.2B MMDiT distilled from Flux-dev for efficient text-to-image generation',
    size: ['8B', 'Q8_0', 'Q4_0', 'FP16']
  },
  {
    name: 'gpustack/stable-diffusion-v3-5-large-turbo-GGUF',
    tags: ['Text-to-Image', 'GGUF'],
    description:
      'Stable Diffusion 3.5 Large Turbo is a Multimodal Diffusion Transformer (MMDiT) text-to-image model with Adversarial Diffusion Distillation (ADD)',
    size: ['14B', 'Q8_0', 'Q4_0']
  },
  {
    name: 'gpustack/FLUX.1-lite-GGUF',
    description:
      'This version uses 7 GB less RAM and runs 23% faster while maintaining the same precision (bfloat16) as the original model',
    tags: ['Text-to-Image', 'GGUF'],
    size: ['14B', 'Q8_0', 'Q4_0']
  }
];
