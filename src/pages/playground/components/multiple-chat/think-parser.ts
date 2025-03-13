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
          // 1 Found `</think>`, but there was no `<think>` before:
          // Take `result` + the content before `</think>` as `thought`
          this.thought =
            this.result + chunk.substring(this.lastCheckedIndex, endIndex);
          this.result = ''; // **clear result**
          this.lastCheckedIndex = endIndex + 8; // Skip `</think>`
        } else if (startIndex !== -1) {
          // 2 Found `<think>`, start thinking mode:
          this.result += chunk.substring(this.lastCheckedIndex, startIndex);
          this.collecting = true;
          this.lastCheckedIndex = startIndex + 7; // Skip `<think>`
        } else {
          // 3 Still in normal mode, append to `result`
          this.result += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
        }
      } else {
        if (endIndex !== -1) {
          // 4 Found `</think>`, end thinking mode:
          this.thought += chunk.substring(this.lastCheckedIndex, endIndex);

          this.collecting = false;
          this.lastCheckedIndex = endIndex + 8; // Skip `</think>`
        } else {
          // 5 Still in thinking mode, append to `thought`
          this.thought += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
        }
      }
    }

    return {
      thought: this.thought.trim(),
      result: this.result,
      isThinking: this.collecting
    };
  }

  reset() {
    this.thought = '';
    this.result = '';
    this.collecting = false;
    this.lastCheckedIndex = 0;
  }
}

export default ThinkParser;
