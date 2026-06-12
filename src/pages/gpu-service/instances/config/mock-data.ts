export default {
  items: [
    {
      name: 'gpustack--amd-epyc-7r32-ln-x64-4c-16g--nvidia-a10g-1d',
      spec: {
        memory: '22Gi',
        cores: '10240',
        computeCapability: '8.6',
        sliced: null,
        cpu: {
          physicalCores: '2',
          threadsPerPhysicalCore: '2',
          logicalCores: '4',
          stepping: null,
          clockSpeed: null,
          maxClockSpeed: null,
          cacheLine: '64',
          cache: {
            l1i: '32768',
            l1d: '32768',
            l2: '524288',
            l3: '8388608'
          },
          manufacturer: 'amd',
          product: 'AMD EPYC 7R32',
          family: '23'
        },
        physicalCores: null,
        threadsPerPhysicalCore: null,
        logicalCores: null,
        stepping: null,
        clockSpeed: null,
        maxClockSpeed: null,
        cacheLine: null,
        cache: {
          l1i: null,
          l1d: null,
          l2: null,
          l3: null
        },
        group: 'gpustack--amd-epyc-7r32-ln-x64-4c-16g--nvidia-a10g-1d',
        acceleratable: true,
        manufacturer: 'nvidia',
        product: 'NVIDIA-A10G',
        family: 'Ampere',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '4',
          ram: '16Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '1',
          cpu: '4',
          ram: '16Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '1',
          cpu: '4',
          ram: '16Gi',
          localStorage: '98Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '1',
              cpu: '4',
              ram: '16Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '1',
              cpu: '4',
              ram: '16Gi',
              localStorage: '98Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--amd-epyc-7r32-ln-x64-4c-16g--nvidia-a10g-1d',
                accelerator: {
                  onceMaxRequest: '1',
                  remaining: '1',
                  capacity: '1'
                },
                cpu: {
                  onceMaxRequest: '4',
                  remaining: '4',
                  capacity: '4'
                },
                ram: {
                  onceMaxRequest: '16Gi',
                  remaining: '16Gi',
                  capacity: '16Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '98Gi',
                  capacity: '98Gi'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-12c-46g--nvidia-tesla-t4-1d',
      spec: {
        memory: '15Gi',
        cores: '2560',
        computeCapability: '7.5',
        sliced: null,
        cpu: {
          physicalCores: '24',
          threadsPerPhysicalCore: '2',
          logicalCores: '48',
          stepping: '7',
          clockSpeed: '2500000000',
          maxClockSpeed: null,
          cacheLine: '64',
          cache: {
            l1i: '32768',
            l1d: '32768',
            l2: '1048576',
            l3: '37486592'
          },
          manufacturer: 'intel',
          product: 'Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz',
          family: '6'
        },
        physicalCores: null,
        threadsPerPhysicalCore: null,
        logicalCores: null,
        stepping: null,
        clockSpeed: null,
        maxClockSpeed: null,
        cacheLine: null,
        cache: {
          l1i: null,
          l1d: null,
          l2: null,
          l3: null
        },
        group:
          'gpustack--intel-xeon-platinum-8259cl-ln-x64-12c-46g--nvidia-tesla-t4-1d',
        acceleratable: true,
        manufacturer: 'nvidia',
        product: 'Tesla-T4',
        family: 'Turing',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '12',
          ram: '46Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '4',
          cpu: '48',
          ram: '186Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '4',
          cpu: '48',
          ram: '186Gi',
          localStorage: '98Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '4',
              cpu: '48',
              ram: '186Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '4',
              cpu: '48',
              ram: '186Gi',
              localStorage: '98Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-12c-46g--nvidia-tesla-t4-1d',
                accelerator: {
                  onceMaxRequest: '4',
                  remaining: '4',
                  capacity: '4'
                },
                cpu: {
                  onceMaxRequest: '48',
                  remaining: '48',
                  capacity: '48'
                },
                ram: {
                  onceMaxRequest: '186Gi',
                  remaining: '186Gi',
                  capacity: '186Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '98Gi',
                  capacity: '98Gi'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-4c-16g--nvidia-tesla-t4-1d',
      spec: {
        memory: '15Gi',
        cores: '2560',
        computeCapability: '7.5',
        sliced: null,
        cpu: {
          physicalCores: '2',
          threadsPerPhysicalCore: '2',
          logicalCores: '4',
          stepping: '7',
          clockSpeed: '2500000000',
          maxClockSpeed: null,
          cacheLine: '64',
          cache: {
            l1i: '32768',
            l1d: '32768',
            l2: '1048576',
            l3: '37486592'
          },
          manufacturer: 'intel',
          product: 'Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz',
          family: '6'
        },
        physicalCores: null,
        threadsPerPhysicalCore: null,
        logicalCores: null,
        stepping: null,
        clockSpeed: null,
        maxClockSpeed: null,
        cacheLine: null,
        cache: {
          l1i: null,
          l1d: null,
          l2: null,
          l3: null
        },
        group:
          'gpustack--intel-xeon-platinum-8259cl-ln-x64-4c-16g--nvidia-tesla-t4-1d',
        acceleratable: true,
        manufacturer: 'nvidia',
        product: 'Tesla-T4',
        family: 'Turing',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '4',
          ram: '16Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '1',
          cpu: '4',
          ram: '16Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '1',
          cpu: '4',
          ram: '16Gi',
          localStorage: '98Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '1',
              cpu: '4',
              ram: '16Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '1',
              cpu: '4',
              ram: '16Gi',
              localStorage: '98Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-4c-16g--nvidia-tesla-t4-1d',
                accelerator: {
                  onceMaxRequest: '1',
                  remaining: '1',
                  capacity: '1'
                },
                cpu: {
                  onceMaxRequest: '4',
                  remaining: '4',
                  capacity: '4'
                },
                ram: {
                  onceMaxRequest: '16Gi',
                  remaining: '16Gi',
                  capacity: '16Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '98Gi',
                  capacity: '98Gi'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--amd-epyc-7r13-processor-ln-x64-1c-2g',
      spec: {
        memory: null,
        cores: null,
        computeCapability: null,
        sliced: null,
        cpu: {
          physicalCores: null,
          threadsPerPhysicalCore: null,
          logicalCores: null,
          stepping: null,
          clockSpeed: null,
          maxClockSpeed: null,
          cacheLine: null,
          cache: {
            l1i: null,
            l1d: null,
            l2: null,
            l3: null
          },
          manufacturer: null,
          product: null,
          family: null
        },
        physicalCores: '8',
        threadsPerPhysicalCore: '2',
        logicalCores: '16',
        stepping: '1',
        clockSpeed: null,
        maxClockSpeed: null,
        cacheLine: '64',
        cache: {
          l1i: '32768',
          l1d: '32768',
          l2: '524288',
          l3: '33554432'
        },
        group: 'gpustack--amd-epyc-7r13-processor-ln-x64-1c-2g',
        acceleratable: false,
        manufacturer: 'amd',
        product: 'AMD EPYC 7R13 Processor',
        family: '25',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '1',
          ram: '2Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '0',
          cpu: '16',
          ram: '32Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '0',
          cpu: '16',
          ram: '32Gi',
          localStorage: '98Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '0',
              cpu: '16',
              ram: '32Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '0',
              cpu: '16',
              ram: '32Gi',
              localStorage: '98Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--amd-epyc-7r13-processor-ln-x64-1c-2g',
                accelerator: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                cpu: {
                  onceMaxRequest: '16',
                  remaining: '16',
                  capacity: '16'
                },
                ram: {
                  onceMaxRequest: '32Gi',
                  remaining: '32Gi',
                  capacity: '32Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '98Gi',
                  capacity: '98Gi'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--amd-epyc-7r32-ln-x64-1c-2g',
      spec: {
        memory: null,
        cores: null,
        computeCapability: null,
        sliced: null,
        cpu: {
          physicalCores: null,
          threadsPerPhysicalCore: null,
          logicalCores: null,
          stepping: null,
          clockSpeed: null,
          maxClockSpeed: null,
          cacheLine: null,
          cache: {
            l1i: null,
            l1d: null,
            l2: null,
            l3: null
          },
          manufacturer: null,
          product: null,
          family: null
        },
        physicalCores: '2',
        threadsPerPhysicalCore: '2',
        logicalCores: '4',
        stepping: null,
        clockSpeed: null,
        maxClockSpeed: null,
        cacheLine: '64',
        cache: {
          l1i: '32768',
          l1d: '32768',
          l2: '524288',
          l3: '8388608'
        },
        group: 'gpustack--amd-epyc-7r32-ln-x64-1c-2g',
        acceleratable: false,
        manufacturer: 'amd',
        product: 'AMD EPYC 7R32',
        family: '23',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '1',
          ram: '2Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '0',
          cpu: '4',
          ram: '8Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '0',
          cpu: '4',
          ram: '8Gi',
          localStorage: '98Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '0',
              cpu: '4',
              ram: '8Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '0',
              cpu: '4',
              ram: '8Gi',
              localStorage: '98Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--amd-epyc-7r32-ln-x64-1c-2g',
                accelerator: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                cpu: {
                  onceMaxRequest: '4',
                  remaining: '4',
                  capacity: '4'
                },
                ram: {
                  onceMaxRequest: '8Gi',
                  remaining: '8Gi',
                  capacity: '8Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '98Gi',
                  capacity: '98Gi'
                }
              }
            ]
          }
        ]
      }
    },
    {
      name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-1c-2g',
      spec: {
        memory: null,
        cores: null,
        computeCapability: null,
        sliced: null,
        cpu: {
          physicalCores: null,
          threadsPerPhysicalCore: null,
          logicalCores: null,
          stepping: null,
          clockSpeed: null,
          maxClockSpeed: null,
          cacheLine: null,
          cache: {
            l1i: null,
            l1d: null,
            l2: null,
            l3: null
          },
          manufacturer: null,
          product: null,
          family: null
        },
        physicalCores: '24',
        threadsPerPhysicalCore: '2',
        logicalCores: '48',
        stepping: '7',
        clockSpeed: '2500000000',
        maxClockSpeed: null,
        cacheLine: '64',
        cache: {
          l1i: '32768',
          l1d: '32768',
          l2: '1048576',
          l3: '37486592'
        },
        group: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-1c-2g',
        acceleratable: false,
        manufacturer: 'intel',
        product: 'Intel(R) Xeon(R) Platinum 8259CL CPU @ 2.50GHz',
        family: '6',
        os: 'linux',
        arch: 'amd64',
        unitResources: {
          cpu: '1',
          ram: '2Gi'
        }
      },
      status: {
        onceMaxRequest: {
          accelerator: '0',
          cpu: '48',
          ram: '96Gi',
          localStorage: '98Gi'
        },
        remaining: {
          accelerator: '0',
          cpu: '52',
          ram: '104Gi',
          localStorage: '196Gi'
        },
        tiers: [
          {
            onceMaxRequest: {
              accelerator: '0',
              cpu: '48',
              ram: '96Gi',
              localStorage: '98Gi'
            },
            remaining: {
              accelerator: '0',
              cpu: '52',
              ram: '104Gi',
              localStorage: '196Gi'
            },
            candidates: [
              {
                cluster: '1',
                name: 'gpustack--intel-xeon-platinum-8259cl-ln-x64-1c-2g',
                accelerator: {
                  onceMaxRequest: '0',
                  remaining: '0',
                  capacity: '0'
                },
                cpu: {
                  onceMaxRequest: '48',
                  remaining: '52',
                  capacity: '52'
                },
                ram: {
                  onceMaxRequest: '96Gi',
                  remaining: '104Gi',
                  capacity: '104Gi'
                },
                localStorage: {
                  onceMaxRequest: '98Gi',
                  remaining: '196Gi',
                  capacity: '196Gi'
                }
              }
            ]
          }
        ]
      }
    }
  ]
};
