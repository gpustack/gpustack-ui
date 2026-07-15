export default {
  items: [
    {
      name: 'gpustack--nvidia-a10g-linux-amd64',
      spec: {
        memory: '24Gi',
        cores: '10240',
        sliceable: true,
        cpu: {
          cache: {}
        },
        cache: {},
        displayName: 'NVIDIA-A10G',
        acceleratorGroup: 'nvidia-a10g',
        generalGroup: 'generic',
        acceleratable: true,
        manufacturer: 'nvidia',
        product: 'NVIDIA-A10G',
        family: 'Ampere',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '4',
          ram: '16Gi'
        },
        localStorage: '100Gi'
      },
      status: {
        onceMaxRequest: {
          accelerator: '1',
          acceleratorShared: '10',
          acceleratorSliced: '100',
          cpu: '0'
        },
        remaining: {
          accelerator: '1',
          acceleratorShared: '10',
          acceleratorSliced: '100',
          cpu: '0'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '1',
              acceleratorShared: '10',
              acceleratorSliced: '100',
              cpu: '0'
            },
            remaining: {
              accelerator: '1',
              acceleratorShared: '10',
              acceleratorSliced: '100',
              cpu: '0'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--nvidia-a10g-linux-amd64',
                phase: 'Active',
                accelerator: {
                  onceMaxRequest: '1',
                  remaining: '1',
                  capacity: '1'
                },
                acceleratorShared: {
                  onceMaxRequest: '10',
                  remaining: '10',
                  capacity: '10'
                },
                acceleratorSliced: {
                  onceMaxRequest: '100',
                  remaining: '100',
                  capacity: '100'
                },
                cpu: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--nvidia-tesla-t4-linux-amd64',
      spec: {
        memory: '16Gi',
        cores: '2560',
        sliceable: true,
        cpu: {
          cache: {}
        },
        cache: {},
        displayName: 'Tesla-T4',
        acceleratorGroup: 'nvidia-tesla-t4',
        generalGroup: 'generic',
        acceleratable: true,
        manufacturer: 'nvidia',
        product: 'Tesla-T4',
        family: 'Turing',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '4',
          ram: '16Gi'
        },
        localStorage: '100Gi'
      },
      status: {
        onceMaxRequest: {
          accelerator: '0',
          acceleratorShared: '0',
          acceleratorSliced: '0',
          cpu: '0'
        },
        remaining: {
          accelerator: '0',
          acceleratorShared: '0',
          acceleratorSliced: '0',
          cpu: '0'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '0',
              acceleratorShared: '0',
              acceleratorSliced: '0',
              cpu: '0'
            },
            remaining: {
              accelerator: '0',
              acceleratorShared: '0',
              acceleratorSliced: '0',
              cpu: '0'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--nvidia-tesla-t4-linux-amd64',
                phase: 'Active',
                accelerator: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '1'
                },
                acceleratorShared: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '10'
                },
                acceleratorSliced: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '100'
                },
                cpu: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--generic-linux-amd64',
      spec: {
        sliceable: false,
        cpu: {
          cache: {}
        },
        cache: {},
        displayName: 'CPU-only',
        generalGroup: 'generic',
        acceleratable: false,
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '1',
          ram: '2Gi'
        },
        localStorage: '100Gi'
      },
      status: {
        onceMaxRequest: {
          accelerator: '0',
          acceleratorShared: '0',
          acceleratorSliced: '0',
          cpu: '16'
        },
        remaining: {
          accelerator: '0',
          acceleratorShared: '0',
          acceleratorSliced: '0',
          cpu: '23'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '0',
              acceleratorShared: '0',
              acceleratorSliced: '0',
              cpu: '16'
            },
            remaining: {
              accelerator: '0',
              acceleratorShared: '0',
              acceleratorSliced: '0',
              cpu: '23'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--generic-linux-amd64',
                phase: 'Active',
                accelerator: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                acceleratorShared: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                acceleratorSliced: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                cpu: {
                  onceMaxRequest: '16',
                  remaining: '23',
                  capacity: '24'
                }
              }
            ]
          }
        ]
      }
    }
  ]
};
