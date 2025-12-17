export default `# This is a template for worker_config.

# debug: false

# ========= directories ===========

# cache_dir: "/var/lib/gpustack/cache"
# log_dir: "/var/lib/gpustack/log"
# bin_dir: "/var/lib/gpustack/bin"

# ========= container & image ===========

# system_default_container_registry: "docker.io"
# image_name_override: "gpustack/gpustack:main"
# image_repo: "gpustack/gpustack"

# ========= gateway ===========

# gateway_mode: "auto"
# gateway_concurrency: 16
# gateway_kubeconfig: "/var/lib/gpustack/higress/kubeconfig"

# ========= service & networking ===========

# service_discovery_name: "worker"
# namespace: "gpustack-system"
# worker_port: 10150
# worker_metrics_port: 10150
# service_port_range: "40000-40063"
# ray_port_range: "41000-41999"

# ========= resources ===========

# resources:

# ========= huggingface ===========

# huggingface_token: 
# enable_hf_transfer: false
# enable_hf_xet: false

# ========= metrics ===========

# disable_worker_metrics: false

# ========= tools & runtime ===========

# pipx_path: "/usr/local/bin/pipx"
# tools_download_base_url: 

# ========= proxy ===========

# proxy_mode: worker
`;
