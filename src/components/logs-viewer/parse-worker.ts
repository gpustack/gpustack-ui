import { controlSeqRegex } from './config';

const removeBrackets = (str: string) => {
  return str?.replace?.(/^\(…\)/, '');
};

const removeBracketsFromLine = (row: string) => {
  return row.startsWith('(…)') ? row.slice(3) : row;
};

interface MessageProps {
  inputStr: string;
  reset?: boolean;
  page?: number;
  isComplete?: boolean;
  chunked?: boolean;
  progress?: number;
  percent?: number;
  isDownloading?: boolean;
}
class AnsiParser {
  private cursorRow: number = 0;
  private cursorCol: number = 0;
  private screen: string[][] = [['']];
  private rawDataRows: number = 0;
  private uid: number = 0;
  private isProcessing: boolean = false;
  private taskQueue: string[] = [];
  private page: number = 1;
  private progress: number = 0;
  private percent: number = 0;
  private isComplete: boolean = false;
  private chunked: boolean = true; // true: send data in chunks, false: send all data at once
  private reminder: string = '';
  private lines: string[] = [];
  isDownloading: boolean = false;
  private pageSize: number = 500;
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
    this.lines = [];
    this.reminder = '';
    this.page = 1;
  }

  public setPage(page: number | undefined) {
    this.page = page ?? 1;
  }

  public setPercent(percent: number | undefined) {
    this.percent = percent ?? 0;
  }

  public setProgress(progress: number | undefined) {
    this.progress = progress ?? 0;
  }

  public setIsCompelete(isComplete: boolean) {
    this.isComplete = isComplete;
  }

  public setChunked(chunked: boolean) {
    this.chunked = chunked ?? true;
  }

  public setIsDownloading(isDownloading: boolean) {
    this.isDownloading = isDownloading;
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

    // const result = this.screen.map((row, index) => ({
    //   content: removeBracketsFromLine(row.join('')),
    //   uid: `${this.page}-${index}`
    // }));
    const result = this.screen.map((row, index) =>
      removeBracketsFromLine(row.join(''))
    );

    return {
      data: result,
      lines: this.rawDataRows,
      remainder: ''
    };
  }

  private getScreenText() {
    const result = this.screen
      .map((row) => removeBracketsFromLine(row.join('')))
      .join('\n');
    return result;
  }

  private processInputByLine(input: string): {
    data: string[];
    lines: number;
    remainder: string;
  } {
    const lines = input?.split(/\r?\n/) || [];
    const remainder = lines.pop() || '';

    // const data = lines.join('\n');
    this.rawDataRows += lines.length;
    lines.forEach((line) => {
      this.lines.push(line);
    });

    return {
      data: this.lines,
      lines: this.rawDataRows,
      remainder
    };
  }

  private getAllLines() {
    return this.lines.join('\n');
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      let input = '';

      if (this.isDownloading) {
        input = this.taskQueue.shift() || '';
      } else {
        input = this.reminder + this.taskQueue.shift();
      }

      if (input) {
        try {
          const result = this.isDownloading
            ? this.processInput(input)
            : this.processInputByLine(input);
          if (!this.isDownloading) {
            this.reminder = result.remainder;
          }

          if (this.chunked) {
            self.postMessage({ result: result.data, lines: result.lines });
          } else if (!this.isComplete) {
            self.postMessage({
              result: '',
              percent: this.percent,
              isComplete: false
            });
          }
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
    } else if (this.isComplete && !this.chunked) {
      self.postMessage({
        result: this.getAllLines(),
        percent: this.percent,
        isComplete: true
      });
      this.reset();
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

self.onmessage = function (event: MessageEvent<MessageProps>) {
  const {
    inputStr,
    reset,
    page,
    isComplete = false,
    chunked = true,
    percent = 0,
    isDownloading = false
  } = event.data;

  parser.setIsDownloading(isDownloading);
  parser.setPage(page);
  parser.setIsCompelete(isComplete);
  parser.setChunked(chunked);
  parser.setPercent(percent);

  if (reset) {
    parser.reset();
  }
  parser.enqueueData(inputStr);
};

self.onerror = function (event) {
  console.error('parse logs error===', event);
};
