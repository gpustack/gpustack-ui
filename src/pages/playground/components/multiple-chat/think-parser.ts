class ThinkParser {
  private lastCheckedIndex: number;
  private collecting: boolean;
  thought: string;
  result: string;

  constructor() {
    this.thought = '';
    this.result = '';
    this.collecting = false;
    this.lastCheckedIndex = 0;
  }

  parse(chunk: string) {
    while (this.lastCheckedIndex < chunk.length) {
      let startIndex = chunk.indexOf('<think>', this.lastCheckedIndex);
      let endIndex = chunk.indexOf('</think>', this.lastCheckedIndex);

      if (!this.collecting) {
        if (endIndex !== -1 && (startIndex === -1 || endIndex < startIndex)) {
          // 1 发现 `</think>`，但之前没有 `<think>`：
          // 将 `result` + `</think>` 之前的内容作为 `thought`
          this.thought =
            this.result + chunk.substring(this.lastCheckedIndex, endIndex);
          this.result = ''; // **清空 result**
          this.lastCheckedIndex = endIndex + 8; // 跳过 `</think>`
        } else if (startIndex !== -1) {
          // 2 发现 `<think>`，进入思考模式：
          this.result += chunk.substring(this.lastCheckedIndex, startIndex);
          this.collecting = true;
          this.lastCheckedIndex = startIndex + 7; // 跳过 `<think>`
        } else {
          // 3 没有 `<think>` 也没有 `</think>`，直接追加到 `result`
          this.result += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
        }
      } else {
        if (endIndex !== -1) {
          // 4 发现 `</think>`，结束思考模式：
          this.thought += chunk.substring(this.lastCheckedIndex, endIndex);

          this.collecting = false;
          this.lastCheckedIndex = endIndex + 8; // 跳过 `</think>`
        } else {
          // 5 仍在思考模式中，追加到 `thought`
          this.thought += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
        }
      }
    }

    return { thought: this.thought.trim(), result: this.result };
  }

  reset() {
    this.thought = '';
    this.result = '';
    this.collecting = false;
    this.lastCheckedIndex = 0;
  }
}

export default ThinkParser;
