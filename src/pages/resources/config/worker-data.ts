export default [
  {
    name: 'sealgpuhost4090.seal.io',
    hostname: 'sealgpuhost4090.seal.io',
    ip: '192.168.50.13',
    port: 10150,
    labels: {
      os: 'linux',
      arch: 'amd64'
    },
    system_reserved: {
      ram: 2147483648,
      vram: 1073741824
    },
    state: 'ready',
    state_message: null,
    status: {
      cpu: {
        total: 20,
        utilization_rate: 0.23809523809523808
      },
      memory: {
        total: 67145928704,
        utilization_rate: 15.049055242865435,
        is_unified_memory: false,
        used: 10104827904,
        allocated: 0
      },
      swap: {
        total: 2051010560,
        utilization_rate: 4.79295435709507,
        used: 98304000
      },
      filesystem: [
        {
          name: '',
          mount_point: '/',
          mount_from: 'overlay',
          total: 980799373312,
          used: 585415233536,
          free: 395384139776,
          available: 345486815232
        }
      ],
      os: {
        name: 'Ubuntu',
        version: '22.04.4 LTS (Jammy Jellyfish)'
      },
      kernel: {
        name: 'Linux',
        release: '6.8.0-52-generic',
        version:
          '#53~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Jan 15 19:18:46 UTC 2',
        architecture: ''
      },
      uptime: {
        uptime: 571202050.0,
        boot_time: '2025-03-03T12:00:43.216+0000'
      },
      gpu_devices: [
        {
          name: 'NVIDIA GeForce RTX 4090 D',
          uuid: '',
          vendor: 'NVIDIA',
          index: 0,
          core: {
            total: 0,
            utilization_rate: 0.0
          },
          memory: {
            total: 25757220864,
            utilization_rate: 10.898062204852629,
            is_unified_memory: false,
            used: 2807037952,
            allocated: 7727166259
          },
          temperature: 44.0,
          labels: {},
          type: 'cuda'
        }
      ],
      rpc_servers: {
        '0': {
          pid: 47,
          port: 50207,
          gpu_index: 0
        }
      }
    },
    unreachable: false,
    heartbeat_time: '2025-03-10T02:40:45Z',
    id: 13,
    created_at: '2025-03-10T01:49:35Z',
    updated_at: '2025-03-10T02:40:45Z'
  },
  {
    name: 'sealgpuhost4080',
    hostname: 'sealgpuhost4080',
    ip: '192.168.50.12',
    port: 10150,
    labels: {
      os: 'linux',
      arch: 'amd64',
      gpu: 'nvidia'
    },
    system_reserved: {
      ram: 2147483648,
      vram: 1073741824
    },
    state: 'ready',
    state_message: null,
    status: {
      cpu: {
        total: 20,
        utilization_rate: 0.23809523809523808
      },
      memory: {
        total: 67112185856,
        utilization_rate: 5.819792489519714,
        is_unified_memory: false,
        used: 3905789952,
        allocated: 0
      },
      swap: {
        total: 2051010560,
        utilization_rate: 13.869811377275404,
        used: 284471296
      },
      filesystem: [
        {
          name: '',
          mount_point: '/',
          mount_from: 'overlay',
          total: 980799373312,
          used: 919767490560,
          free: 61031882752,
          available: 11134558208
        }
      ],
      os: {
        name: 'Ubuntu',
        version: '22.04.4 LTS (Jammy Jellyfish)'
      },
      kernel: {
        name: 'Linux',
        release: '6.8.0-52-generic',
        version:
          '#53~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Jan 15 19:18:46 UTC 2',
        architecture: ''
      },
      uptime: {
        uptime: 1014716590.0,
        boot_time: '2025-02-26T08:48:22.690+0000'
      },
      gpu_devices: [
        {
          name: 'NVIDIA GeForce RTX 4080 SUPER',
          uuid: '',
          vendor: 'NVIDIA',
          index: 0,
          core: {
            total: 0,
            utilization_rate: 0.0
          },
          memory: {
            total: 17171480576,
            utilization_rate: 1.642647777234978,
            is_unified_memory: false,
            used: 282066944,
            allocated: null
          },
          temperature: 42.0,
          labels: {},
          type: 'cuda'
        },
        {
          name: 'NVIDIA GeForce RTX 4080 SUPER',
          uuid: '',
          vendor: 'NVIDIA',
          index: 1,
          core: {
            total: 0,
            utilization_rate: 0.0
          },
          memory: {
            total: 17171480576,
            utilization_rate: 1.642647777234978,
            is_unified_memory: false,
            used: 282066944,
            allocated: null
          },
          temperature: 41.0,
          labels: {},
          type: 'cuda'
        }
      ],
      rpc_servers: {
        '0': {
          pid: 46,
          port: 50446,
          gpu_index: 0
        },
        '1': {
          pid: 47,
          port: 50472,
          gpu_index: 1
        }
      }
    },
    unreachable: false,
    heartbeat_time: '2025-03-10T02:40:19Z',
    id: 12,
    created_at: '2025-03-07T06:31:13Z',
    updated_at: '2025-03-10T02:40:19Z'
  },
  {
    name: 'YL-MacBook-Pro.local',
    hostname: 'YL-MacBook-Pro.local',
    ip: '192.168.50.54',
    port: 10150,
    labels: {
      os: 'darwin',
      arch: 'arm64'
    },
    system_reserved: {
      ram: 2147483648,
      vram: 1073741824
    },
    state: 'not_ready',
    state_message: 'Heartbeat lost',
    status: {
      cpu: {
        total: 8,
        utilization_rate: 33.201581027667984
      },
      memory: {
        total: 17179869184,
        utilization_rate: 84.29336547851562,
        is_unified_memory: true,
        used: 14481489920,
        allocated: 3221225472
      },
      swap: {
        total: 11811160064,
        utilization_rate: 94.81977982954545,
        used: 11199315968
      },
      filesystem: [
        {
          name: 'Macintosh HD',
          mount_point: '/',
          mount_from: '/dev/disk3s1s1',
          total: 494384795648,
          used: 476589662208,
          free: 17795133440,
          available: 17795133440
        },
        {
          name: 'Data',
          mount_point: '/System/Volumes/Data',
          mount_from: '/dev/disk3s5',
          total: 494384795648,
          used: 476587806720,
          free: 17796988928,
          available: 17796988928
        },
        {
          name: 'Hardware',
          mount_point: '/System/Volumes/Hardware',
          mount_from: '/dev/disk1s3',
          total: 524288000,
          used: 19374080,
          free: 504913920,
          available: 504913920
        },
        {
          name: 'Preboot',
          mount_point: '/System/Volumes/Preboot',
          mount_from: '/dev/disk3s2',
          total: 494384795648,
          used: 476589207552,
          free: 17795588096,
          available: 17795588096
        },
        {
          name: 'Update',
          mount_point: '/System/Volumes/Update',
          mount_from: '/dev/disk3s4',
          total: 494384795648,
          used: 476588724224,
          free: 17796071424,
          available: 17796071424
        },
        {
          name: 'mnt1',
          mount_point: '/System/Volumes/Update/SFR/mnt1',
          mount_from: '/dev/disk2s1',
          total: 5368664064,
          used: 1894137856,
          free: 3474526208,
          available: 3474526208
        },
        {
          name: 'mnt1',
          mount_point: '/System/Volumes/Update/mnt1',
          mount_from: '/dev/disk3s1',
          total: 494384795648,
          used: 476588724224,
          free: 17796071424,
          available: 17796071424
        },
        {
          name: 'VM',
          mount_point: '/System/Volumes/VM',
          mount_from: '/dev/disk3s6',
          total: 494384795648,
          used: 476588724224,
          free: 17796071424,
          available: 17796071424
        },
        {
          name: 'iSCPreboot',
          mount_point: '/System/Volumes/iSCPreboot',
          mount_from: '/dev/disk1s1',
          total: 524288000,
          used: 19374080,
          free: 504913920,
          available: 504913920
        },
        {
          name: 'xarts',
          mount_point: '/System/Volumes/xarts',
          mount_from: '/dev/disk1s2',
          total: 524288000,
          used: 19374080,
          free: 504913920,
          available: 504913920
        }
      ],
      os: {
        name: 'macOS',
        version: '15.1'
      },
      kernel: {
        name: 'Darwin',
        release: '24.1.0',
        version:
          'Darwin Kernel Version 24.1.0: Thu Oct 10 21:03:15 PDT 2024; root:xnu-11215.41.3~2/RELEASE_ARM64_T6000',
        architecture: ''
      },
      uptime: {
        uptime: 599623858.0,
        boot_time: '2025-02-28T16:02:47.400+0800'
      },
      gpu_devices: [
        {
          name: 'Apple M1 Pro',
          uuid: null,
          vendor: 'Apple',
          index: 0,
          core: {
            total: 14,
            utilization_rate: 15.0
          },
          memory: {
            total: 11453251584,
            utilization_rate: 8.709235806829545,
            is_unified_memory: true,
            used: 997490688,
            allocated: 0
          },
          temperature: 66.06063079833984,
          labels: {},
          type: 'mps'
        }
      ],
      rpc_servers: {
        '0': {
          pid: 95111,
          port: 50515,
          gpu_index: 0
        }
      }
    },
    unreachable: true,
    heartbeat_time: '2025-03-07T06:36:31Z',
    id: 11,
    created_at: '2025-03-06T11:37:26Z',
    updated_at: '2025-03-07T10:27:56Z'
  },
  {
    name: 'sealgpuhost7800',
    hostname: 'sealgpuhost7800',
    ip: '192.168.50.14',
    port: 10150,
    labels: {
      os: 'linux',
      arch: 'amd64',
      gpu: 'amd'
    },
    system_reserved: {
      ram: 2147483648,
      vram: 1073741824
    },
    state: 'not_ready',
    state_message: 'Heartbeat lost',
    status: {
      cpu: {
        total: 20,
        utilization_rate: 0.9761904761904763
      },
      memory: {
        total: 67191525376,
        utilization_rate: 5.488417861275733,
        is_unified_memory: false,
        used: 3687751680,
        allocated: 0
      },
      swap: {
        total: 1023406080,
        utilization_rate: 0.3842228492525665,
        used: 3932160
      },
      filesystem: [
        {
          name: '',
          mount_point: '/',
          mount_from: '/dev/mapper/vgubuntu-root',
          total: 981810135040,
          used: 630255669248,
          free: 351554465792,
          available: 301605761024
        },
        {
          name: '',
          mount_point: '/boot/efi',
          mount_from: '/dev/nvme1n1p1',
          total: 535805952,
          used: 38793216,
          free: 497012736,
          available: 497012736
        }
      ],
      os: {
        name: 'Ubuntu',
        version: '22.04.5 LTS (Jammy Jellyfish)'
      },
      kernel: {
        name: 'Linux',
        release: '6.8.0-52-generic',
        version:
          '#53~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Jan 15 19:18:46 UTC 2',
        architecture: ''
      },
      uptime: {
        uptime: 1022560490.0,
        boot_time: '2025-02-12T18:07:31.198+0800'
      },
      gpu_devices: [
        {
          name: 'AMD Radeon RX 7800 XT',
          uuid: '5c88007d760374f3',
          vendor: 'AMD',
          index: 0,
          core: {
            total: 60,
            utilization_rate: 1.0
          },
          memory: {
            total: 17163091968,
            utilization_rate: 4.106073015945748,
            is_unified_memory: false,
            used: 704729088,
            allocated: null
          },
          temperature: 57.0,
          labels: {
            llvm: 'gfx1101'
          },
          type: 'rocm'
        }
      ],
      rpc_servers: {
        '0': {
          pid: 386190,
          port: 50218,
          gpu_index: 0
        }
      }
    },
    unreachable: true,
    heartbeat_time: '2025-02-24T06:10:12Z',
    id: 9,
    created_at: '2025-02-21T12:08:47Z',
    updated_at: '2025-03-07T03:12:24Z'
  },
  {
    name: 'Seals-Mac-Studio.local',
    hostname: 'Seals-Mac-Studio.local',
    ip: '192.168.50.4',
    port: 10150,
    labels: {
      os: 'darwin',
      arch: 'arm64',
      gpu: 'mac'
    },
    system_reserved: {
      ram: 2147483648,
      vram: 1073741824
    },
    state: 'ready',
    state_message: null,
    status: {
      cpu: {
        total: 24,
        utilization_rate: 0.12254901960784313
      },
      memory: {
        total: 206158430208,
        utilization_rate: 25.71740945180257,
        is_unified_memory: true,
        used: 53018607616,
        allocated: 2261185144
      },
      swap: {
        total: 1073741824,
        utilization_rate: 0.445556640625,
        used: 4784128
      },
      filesystem: [
        {
          name: 'Macintosh HD',
          mount_point: '/',
          mount_from: '/dev/disk3s1s1',
          total: 994662584320,
          used: 941091860480,
          free: 53570723840,
          available: 53570723840
        },
        {
          name: 'Data',
          mount_point: '/System/Volumes/Data',
          mount_from: '/dev/disk3s5',
          total: 994662584320,
          used: 941092052992,
          free: 53570531328,
          available: 53570531328
        },
        {
          name: 'Hardware',
          mount_point: '/System/Volumes/Hardware',
          mount_from: '/dev/disk1s3',
          total: 524288000,
          used: 17379328,
          free: 506908672,
          available: 506908672
        },
        {
          name: 'Preboot',
          mount_point: '/System/Volumes/Preboot',
          mount_from: '/dev/disk3s2',
          total: 994662584320,
          used: 941090258944,
          free: 53572325376,
          available: 53572325376
        },
        {
          name: 'Update',
          mount_point: '/System/Volumes/Update',
          mount_from: '/dev/disk3s4',
          total: 994662584320,
          used: 941103759360,
          free: 53558824960,
          available: 53558824960
        },
        {
          name: 'mnt1',
          mount_point: '/System/Volumes/Update/mnt1',
          mount_from: '/dev/disk3s1',
          total: 994662584320,
          used: 941103759360,
          free: 53558824960,
          available: 53558824960
        },
        {
          name: 'VM',
          mount_point: '/System/Volumes/VM',
          mount_from: '/dev/disk3s6',
          total: 994662584320,
          used: 941103759360,
          free: 53558824960,
          available: 53558824960
        },
        {
          name: 'iSCPreboot',
          mount_point: '/System/Volumes/iSCPreboot',
          mount_from: '/dev/disk1s1',
          total: 524288000,
          used: 17379328,
          free: 506908672,
          available: 506908672
        },
        {
          name: 'xarts',
          mount_point: '/System/Volumes/xarts',
          mount_from: '/dev/disk1s2',
          total: 524288000,
          used: 17379328,
          free: 506908672,
          available: 506908672
        }
      ],
      os: {
        name: 'macOS',
        version: '14.7.4'
      },
      kernel: {
        name: 'Darwin',
        release: '23.6.0',
        version:
          'Darwin Kernel Version 23.6.0: Thu Dec 19 20:44:43 PST 2024; root:xnu-10063.141.1.703.2~1/RELEASE_ARM64_T6020',
        architecture: ''
      },
      uptime: {
        uptime: 1731750286.0,
        boot_time: '2025-02-18T09:38:04.957+0800'
      },
      gpu_devices: [
        {
          name: 'Apple M2 Ultra',
          uuid: null,
          vendor: 'Apple',
          index: 0,
          core: {
            total: 60,
            utilization_rate: 0.0
          },
          memory: {
            total: 154618822656,
            utilization_rate: 0.015894571940104164,
            is_unified_memory: true,
            used: 24576000,
            allocated: 26103233194
          },
          temperature: null,
          labels: {},
          type: 'mps'
        }
      ],
      rpc_servers: {
        '0': {
          pid: 42154,
          port: 50789,
          gpu_index: 0
        }
      }
    },
    unreachable: false,
    heartbeat_time: '2025-03-10T02:40:35Z',
    id: 7,
    created_at: '2025-02-19T09:18:17Z',
    updated_at: '2025-03-10T02:40:35Z'
  }
];
