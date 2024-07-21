import { StatusMaps } from '@/config';

export const WorkerStatusMap = {
  ready: 'ready',
  not_ready: 'not_ready'
};

export const WorkerStatusMapValue = {
  [WorkerStatusMap.ready]: 'Ready',
  [WorkerStatusMap.not_ready]: 'Not Ready'
};

export const status: any = {
  [WorkerStatusMap.ready]: StatusMaps.success,
  [WorkerStatusMap.not_ready]: StatusMaps.error
};

export const addWorkerGuide = {
  mac: {
    getToken: 'cat /var/lib/gpustack/token',
    registerWorker(server: string) {
      return `curl -sfL https://get.gpustack.ai | sh -s - --server-url ${server} --token mytoken`;
    }
  },
  win: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(server: string) {
      return `Invoke-Expression "& { $((Invoke-WebRequest -Uri "https://get.gpustack.ai" -UseBasicParsing).Content) } -ServerURL ${server} -Token mytoken"`;
    }
  }
};
