const removeBrackets = (str: string) => {
  return str?.replace?.(/^\(.*?\)/, '');
};
const parseAnsi = (
  inputStr: string,
  setId: () => number,
  clearScreen: () => void
) => {
  let cursorRow = 0; // current row
  let cursorCol = 0; // current column
  // screen content array
  let screen = [['']];
  // replace carriage return and newline characters in the text
  let input = inputStr.replace(/\r\n/g, '\n');

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

  // ANSI
  const controlSeqRegex = /\x1b\[(\d*);?(\d*)?([A-DJKHfm])/g;
  let output = ''; // output text

  let match;
  let lastIndex = 0;

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

    // handle ANSI control characters
    switch (command) {
      case 'A': // move the cursor up
        cursorRow = Math.max(0, cursorRow - n);
        break;
      case 'B': // move the cursor down
        cursorRow += n;
        break;
      case 'C': // move the cursor right
        cursorCol += n;
        break;
      case 'D': // move the cursor left
        cursorCol = Math.max(0, cursorCol - n);
        break;
      case 'H': // move the cursor to the specified position (n, m)
        cursorRow = Math.max(0, n - 1);
        cursorCol = Math.max(0, m - 1);
        break;
      case 'J': // clear the screen
        if (n === 2) {
          screen = [['']];
          cursorRow = 0;
          cursorCol = 0;
          clearScreen?.();
        }
        break;
      case 'm': // color
        if (match[1] === '0') {
          currentStyle = '';
        } else if (colorMap[match[1]]) {
          currentStyle = `color: ${colorMap[match[1]]};`;
        }
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

export default parseAnsi;
