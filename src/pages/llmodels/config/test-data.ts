export default {
  items: [
    {
      backend_name: 'vLLM',
      is_built_in: true,
      backend_source: 'built-in',
      default_version: '0.13.0',
      default_backend_param: [],
      versions: [
        {
          version: '0.13.0',
          is_deprecated: false
        },
        {
          version: '0.12.0',
          is_deprecated: false
        },
        {
          version: '0.11.2',
          is_deprecated: false
        },
        {
          version: '0.11.0',
          is_deprecated: true
        },
        {
          version: '0.10.2',
          is_deprecated: false
        },
        {
          version: '0.10.1.1',
          is_deprecated: true
        },
        {
          version: '0.10.0',
          is_deprecated: true
        }
      ]
    },
    {
      backend_name: 'SGLang',
      backend_source: 'built-in',
      is_built_in: true,
      default_version: '0.5.7',
      default_backend_param: [],
      versions: [
        {
          version: '0.5.7',
          is_deprecated: false
        },
        {
          version: '0.5.6.post2',
          is_deprecated: false
        },
        {
          version: '0.5.5.post3',
          is_deprecated: false
        },
        {
          version: '0.5.5',
          is_deprecated: true
        },
        {
          version: '0.5.4.post3',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'MindIE',
      backend_source: 'built-in',
      is_built_in: true,
      default_version: null,
      default_backend_param: [],
      versions: []
    },
    {
      backend_name: 'VoxBox',
      backend_source: 'built-in',
      is_built_in: true,
      default_version: '0.0.21',
      default_backend_param: [],
      versions: [
        {
          version: '0.0.21',
          is_deprecated: false
        },
        {
          version: '0.0.20',
          is_deprecated: true
        }
      ]
    },
    {
      backend_name: 'kokoro',
      backend_source: 'community',
      is_built_in: false,
      default_version: '',
      default_backend_param: [],
      versions: [
        {
          version: 'latest',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'llama.cpp',
      backend_source: 'community',
      is_built_in: false,
      default_version: 'cpu',
      default_backend_param: [],
      versions: [
        {
          version: 'cuda',
          is_deprecated: false
        },
        {
          version: 'cpu',
          is_deprecated: false
        },
        {
          version: 'vulkan',
          is_deprecated: false
        },
        {
          version: 'musa',
          is_deprecated: false
        },
        {
          version: 'rocm',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'MinerU',
      backend_source: 'community',
      is_built_in: false,
      default_version: 'v2.7.0',
      default_backend_param: [],
      versions: [
        {
          version: 'v2.7.0',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'paddlex-genai',
      backend_source: 'community',
      is_built_in: false,
      default_version: 'latest',
      default_backend_param: [],
      versions: [
        {
          version: 'latest',
          is_deprecated: false
        },
        {
          version: 'latest-dcu',
          is_deprecated: false
        },
        {
          version: 'latest-metax-gpu',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'text-embeddings-inference',
      is_built_in: false,
      backend_source: 'community',
      default_version: 'cpu-1.8',
      default_backend_param: [],
      versions: [
        {
          version: 'cpu-1.8',
          is_deprecated: false
        },
        {
          version: 'cuda-sm89-1.8',
          is_deprecated: false
        },
        {
          version: 'cuda-sm86-1.8',
          is_deprecated: false
        },
        {
          version: 'cuda-sm80-1.8',
          is_deprecated: false
        }
      ]
    },
    {
      backend_name: 'Custom',
      backend_source: 'custom',
      is_built_in: false,
      default_version: null,
      default_backend_param: null,
      versions: []
    }
  ]
};
