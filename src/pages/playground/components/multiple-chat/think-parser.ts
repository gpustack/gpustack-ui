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
      if (!this.collecting) {
        let startIndex = chunk.indexOf('<think>', this.lastCheckedIndex);
        if (startIndex !== -1) {
          this.result += chunk.substring(this.lastCheckedIndex, startIndex);
          this.collecting = true;
          this.lastCheckedIndex = startIndex + 7;
        } else {
          this.result += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
          break;
        }
      } else {
        let endIndex = chunk.indexOf('</think>', this.lastCheckedIndex);
        if (endIndex !== -1) {
          this.thought += chunk.substring(this.lastCheckedIndex, endIndex);
          this.collecting = false;
          this.lastCheckedIndex = endIndex + 8;
        } else {
          this.thought += chunk.substring(this.lastCheckedIndex);
          this.lastCheckedIndex = chunk.length;
          break;
        }
      }
    }

    return { thought: this.thought.trimStart(), result: this.result };
  }

  reset() {
    this.thought = '';
    this.result = '';
    this.collecting = false;
    this.lastCheckedIndex = 0;
  }
}

export default ThinkParser;
