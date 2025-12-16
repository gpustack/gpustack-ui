export default `# This is a template for worker_config.

worker_config:
  debug: true

  # directories
  cache_dir: 
  log_dir: 
  bin_dir: 

  # container & image
  system_default_container_registry: 
  image_repo: gpustack/worker
  image_name_override: ""

  # gateway
  gateway_mode: 
  gateway_concurrency: 0
  gateway_kubeconfig: ""

  # service & networking
  service_discovery_name: 
  namespace: default
  worker_port: 
  worker_metrics_port: 
  service_port_range: 
  ray_port_range: 

  # resources
  resources:
    gpu:
      count: 
      type: 
    cpu:
      limit: 
    memory:
      limit: 

  # huggingface
  huggingface_token: ""
  enable_hf_transfer: true
  enable_hf_xet: true

  # metrics
  disable_worker_metrics: false

  # tools & runtime
  pipx_path: 
  tools_download_base_url: 

  # proxy
  proxy_mode: worker
`;
