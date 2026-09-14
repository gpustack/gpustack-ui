export const dockerConfig = `# This is a template for worker_config.
 
# debug: false
 
# ========= directories ===========
 
# cache_dir: "/var/lib/gpustack/cache"
# log_dir: "/var/lib/gpustack/log"
 
# ========= container & image ===========
 
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
 
# image_name_override: "gpustack/gpustack:dev"
# image_repo: "gpustack/gpustack"

# ========= service & networking ===========

# service_discovery_name: "worker"
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

// Placeholder for the Chart Values editor. Comment-only on purpose: an empty
// editor must stay empty on submit (the field is omitted rather than sent as
// `{}`), and a commented example parses to nothing.
export const chartValuesTemplate = `# The chart's own values, merged over the ones the server derives;
# only settings with no field above belong here. Top-level keys are
# GPUStack's own, everything under \`gpustack-operator\` is the
# operator chart's. Lists replace rather than extend.

# debug: true  # verbose logging on the GPUStack workers
# clusterDomain: cluster.local  # when not the cluster default

# Declare a component this cluster already runs, so this release
# does not install a second one: kueue, node-feature-discovery,
# csi-driver-nfs, csi-driver-s3.
#
# WARNING: Kueue and Node Feature Discovery are not optional. The
# operator waits for their CRDs at startup, so switching off one
# this cluster does not actually run stops it from starting; and
# switching off one this release installed deletes it, taking
# Kueue's CRDs and every Workload and ClusterQueue with them.
# gpustack-operator:
#   csi-driver-s3:
#     enabled: false
#   worker:
#     replicas: 2  # leader election keeps the extras standing by
#     resources:  # chart default is 4 CPU / 8Gi
#       limits:
#         cpu: "2"
#         memory: 4Gi
`;
