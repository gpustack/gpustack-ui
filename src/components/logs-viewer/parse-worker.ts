import { controlSeqRegex } from './config';

let uid = 0;

const setId = () => {
  uid += 1;
  return uid;
};

const removeBrackets = (str: string) => {
  return str?.replace?.(/^\(…\)/, '');
};

const isClean = (input: string) => {
  let match = controlSeqRegex.exec(input) || [];
  const command = match?.[3];
  const n = parseInt(match?.[1], 10) || 1;
  return command === 'J' && n === 2;
};

const parseAnsi = (input: string, setId: () => number) => {
  let cursorRow = 0;
  let cursorCol = 0;
  let screen = [['']];
  let lastIndex = 0;

  // let input = inputStr.replace(replaceLineRegex, '\n');

  // handle the \r and \n characters in the text
  const handleText = (text: string) => {
    let processed = '';
    for (let char of text) {
      if (char === '\r') {
        cursorCol = 0; // move to the beginning of the line
      } else if (char === '\n') {
        cursorRow++; // move to the next line
        cursorCol = 0; // move to the beginning of the line
        screen[cursorRow] = screen[cursorRow] || ['']; // create a new line if it does not exist
      } else {
        // add the character to the screen content array
        screen[cursorRow][cursorCol] = char;
        cursorCol++;
      }
    }
    return processed;
  };

  let output = ''; // output text

  let match;

  // ANSI color map
  const colorMap: Record<string, string> = {
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': 'yellow',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white'
  };

  let currentStyle = ''; // current text style

  // match ANSI control characters
  while ((match = controlSeqRegex.exec(input)) !== null) {
    // handle text before the control character
    let textBeforeControl = input.slice(lastIndex, match.index);
    output += handleText(textBeforeControl); // add the processed text to the output
    lastIndex = controlSeqRegex.lastIndex; // update the last index

    const n = parseInt(match[1], 10) || 1;
    const m = parseInt(match[2], 10) || 1;
    const command = match[3];
    console.log('command', {
      command,
      cursorRow,
      n
    });

    // handle ANSI control characters
    switch (command) {
      case 'A': // up
        cursorRow = Math.max(0, cursorRow - n);
        if (cursorRow === 0) {
          // screen = [['']];
          // cursorCol = 0;
        }
        break;
      case 'B': // down
        cursorRow += n;
        break;
      case 'C': // right
        cursorCol += n;
        break;
      case 'D': // left
        cursorCol = Math.max(0, cursorCol - n);
        break;
      case 'H': // move the cursor to the specified position (n, m)
        cursorRow = Math.max(0, n - 1);
        cursorCol = Math.max(0, m - 1);
        break;
      case 'J': // clear the screen
        if (n === 2) {
          console.log('clear====');
          screen = [['']];
          cursorRow = 0;
          cursorCol = 0;
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

    // check if the row and column are within the screen content array
    while (screen.length <= cursorRow) {
      screen.push(['']);
    }
    while (screen[cursorRow].length <= cursorCol) {
      screen[cursorRow].push('');
    }
  }

  // handle the remaining text
  output += handleText(input.slice(lastIndex));

  let result = [];
  for (let row = 0; row < screen.length; row++) {
    let rowContent = screen[row].join('');
    result.push({
      content: removeBrackets(rowContent),
      uid: setId()
    });
  }
  result.push({
    content: output,
    uid: setId()
  });

  return result;
};

self.onmessage = function (event) {
  const { inputStr } = event.data;

  const parsedData = Array.from(parseAnsi(inputStr, setId));

  const result = parsedData.map((item) => ({
    content: item.content,
    uid: item.uid
  }));
  self.postMessage(result);
};
