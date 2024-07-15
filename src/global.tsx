// 应用前置、全局运行的逻辑时 会在这里执行

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
