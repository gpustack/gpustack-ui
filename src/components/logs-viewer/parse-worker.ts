import { controlSeqRegex } from './config';

const removeBrackets = (str: string) => {
  return str?.replace?.(/^\(…\)/, '');
};

class AnsiParser {
  private cursorRow: number = 0;
  private cursorCol: number = 0;
  private screen: string[][] = [['']];
  private rawDataRows: number = 0;
  private uid: number = 0;
  private isProcessing: boolean = false;
  private taskQueue: string[] = [];
  private colorMap = {
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': 'yellow',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white'
  };

  constructor() {
    this.reset();
  }

  public reset() {
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.screen = [['']];
    this.rawDataRows = 0;
    this.uid = this.uid + 1;
  }

  private setId() {
    this.uid += 1;
    return this.uid;
  }

  private handleText(text: string) {
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      if (char === '\r') {
        let nextChar = text[i + 1];
        if (nextChar === '\n') {
          continue; // windows new line: \r\n
        } else {
          this.cursorCol = 0; // move to the beginning of the line
        }
      } else if (char === '\n') {
        this.rawDataRows++;
        this.cursorRow++;
        this.cursorCol = 0; // back to the beginning of the line
        if (!this.screen[this.cursorRow]) {
          this.screen[this.cursorRow] = [''];
        }
      } else {
        const currentLine = this.screen[this.cursorRow];
        currentLine[this.cursorCol] = char;
        this.cursorCol++;
      }
    }
  }

  private handleAnsiSequence(match: RegExpExecArray, isEnd: boolean) {
    const n = parseInt(match[1] || '1', 10);
    const m = parseInt(match[2] || '1', 10);
    const command = match[3];

    switch (command) {
      case 'A':
        this.cursorRow = Math.max(0, this.cursorRow - n);
        break;
      case 'B':
        this.cursorRow += n;
        break;
      case 'C': // move the cursor to the right
        this.cursorCol += n;
        break;
      case 'D': // move the cursor to the left
        this.cursorCol = Math.max(0, this.cursorCol - n);
        break;
      case 'H': // move the cursor to the specified position (n, m)
        this.cursorRow = Math.max(0, n - 1);
        this.cursorCol = Math.max(0, m - 1);
        break;
      case 'J': // clear the screen
        if (n === 2) {
          this.reset();
        }
        break;
      case 'm':
        // if (match[1] === '0') {
        //   currentStyle = '';
        // } else if (colorMap[match[1]]) {
        //   currentStyle = `color: ${colorMap[match[1]]};`;
        // }
        break;
    }

    while (this.screen.length <= this.cursorRow && !isEnd) {
      this.screen.push(['']);
    }
    while (this.screen[this.cursorRow].length <= this.cursorCol && !isEnd) {
      this.screen[this.cursorRow].push('');
    }
  }

  private processInput(input: string) {
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = controlSeqRegex.exec(input)) !== null) {
      const textBeforeControl = input.slice(lastIndex, match.index);
      this.handleText(textBeforeControl);

      lastIndex = controlSeqRegex.lastIndex;

      this.handleAnsiSequence(match, lastIndex === input.length - 1);
    }

    const remainingText = input.slice(lastIndex);
    this.handleText(remainingText);

    const result = this.screen.map((row) => ({
      content: removeBrackets(row.join('')),
      uid: this.setId()
    }));

    return {
      data: result,
      lines: this.rawDataRows
    };
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const input = this.taskQueue.shift();

      if (input) {
        try {
          const result = this.processInput(input);
          self.postMessage({ result: result.data, lines: result.lines });
        } catch (error) {
          console.error('Error processing input:', error);
        }
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    this.isProcessing = false;
    if (this.taskQueue.length > 0) {
      this.processQueue();
    }
  }

  public enqueueData(input: string): void {
    this.taskQueue.push(input);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
}
const parser = new AnsiParser();

self.onmessage = function (event) {
  const { inputStr, reset } = event.data;
  if (reset) {
    parser.reset();
  }
  parser.enqueueData(inputStr);
};

self.onerror = function (event) {
  console.error('parse logs error===', event);
};
