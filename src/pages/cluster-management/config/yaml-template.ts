export const dockerConfig = `# This is a template for worker_config.
 
# debug: false
 
# ========= directories ===========
 
# cache_dir: "/var/lib/gpustack/cache"
# log_dir: "/var/lib/gpustack/log"
 
# ========= container & image ===========
 
# system_default_container_registry: "docker.io"
# image_name_override: "gpustack/gpustack:dev"
# image_repo: "gpustack/gpustack"
 
# ========= service & networking ===========
 

# worker_port: 10150
# worker_metrics_port: 10150
# service_port_range: "40000-40063"
# ray_port_range: "41000-41999"
 
# ========= resources ===========
 
# system_reserved:
#   ram: 2
#   vram: 1
 
# ========= huggingface ===========
 
# huggingface_token: 
# enable_hf_transfer: false
# enable_hf_xet: false
 
# ========= metrics ===========
 
# disable_worker_metrics: false
 
# ========= proxy ===========
 
# proxy_mode: worker
`;

export const kubernetesConfig = `# This is a template for worker_config.
 
# debug: false
 
# ========= directories ===========
 
# cache_dir: "/var/lib/gpustack/cache"
# log_dir: "/var/lib/gpustack/log"
 
# ========= container & image ===========
 
# system_default_container_registry: "docker.io"
# image_name_override: "gpustack/gpustack:dev"
# image_repo: "gpustack/gpustack"
 
# ========= service & networking ===========
 
# service_discovery_name: "worker"
# namespace: "gpustack-system"
# worker_port: 10150
# worker_metrics_port: 10150
# service_port_range: "40000-40063"
# ray_port_range: "41000-41999"
 
# ========= resources ===========
 
# system_reserved:
#   ram: 2
#   vram: 1
 
# ========= huggingface ===========
 
# huggingface_token: 
# enable_hf_transfer: false
# enable_hf_xet: false
 
# ========= metrics ===========
 
# disable_worker_metrics: false
 
# ========= proxy ===========
 
# proxy_mode: worker`;
