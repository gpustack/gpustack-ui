import lmDeployLogo from '@/assets/logo/lmdeploy.png';
import SGLangLogo from '@/assets/logo/sglang.png';
import vLLMLogo from '@/assets/logo/vllm.png';

export default [
  {
    id: 1,
    backend_name: 'SGlang',
    icon: SGLangLogo,
    version_configs: {
      'v1.0': {
        image_name: 'example/image:v1.0',
        run_command: 'run.sh'
      }
    },
    compatibility_type: 'template_string',
    health_check_path: '/v1/models',
    default_version: 'v1.0',
    default_backend_param: ['--param1', '--param2'],
    description: 'sglang description'
  },
  {
    id: 2,
    backend_name: 'vLLM',
    icon: vLLMLogo,
    version_configs: {
      'v1.0': {
        image_name: 'example/image:v1.0',
        run_command: 'run.sh'
      }
    },
    compatibility_type: 'template_string',
    health_check_path: '/v1/models',
    default_version: 'v1.0',
    default_backend_param: ['--param1', '--param2'],
    description: 'vllm description'
  },
  {
    id: 3,
    backend_name: 'LMDeploy',
    icon: lmDeployLogo,
    version_configs: {
      'v1.0': {
        image_name: 'example/image:v1.0',
        run_command: 'run.sh'
      }
    },
    compatibility_type: 'template_string',
    health_check_path: '/v1/models',
    default_version: 'v1.0',
    default_backend_param: ['--param1', '--param2'],
    description: 'LMDeploy description'
  }
];
