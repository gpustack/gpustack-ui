class ThinkParser {
  thought: string;
  result: string;
  collecting: boolean;
  lastCheckedIndex: number;

  constructor() {
    this.thought = '';
    this.result = '';
    this.collecting = false;
    this.lastCheckedIndex = 0;
  }

  parse(chunk: string) {
    if (this.lastCheckedIndex < chunk.length) {
      const currentChunk = chunk.substring(this.lastCheckedIndex);

      if (!this.collecting) {
        //  find <think> tag
        let startIndex = currentChunk.indexOf('<think>');
        if (startIndex !== -1) {
          // handle text before <think> tag
          this.result += currentChunk.substring(0, startIndex);
          // handle thought part
          this.thought += currentChunk.substring(startIndex + 7);
          this.collecting = true;
        } else {
          // if no <think> tag found, just append the whole chunk to result
          this.result += currentChunk;
        }
      } else {
        // find </think> tag
        let endIndex = currentChunk.indexOf('</think>');
        if (endIndex !== -1) {
          // handle text before </think> tag
          this.thought += currentChunk.substring(0, endIndex);
          // handle result part
          this.result += currentChunk.substring(endIndex + 8);

          this.collecting = false;
        } else {
          this.thought += currentChunk;
        }
        this.lastCheckedIndex = chunk.length;
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
