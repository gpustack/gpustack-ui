import { useRef, useState } from 'react';

const usePaseByLine = () => {
  const [result, setResult] = useState<any[]>([]);
  const uidRef = useRef(0);

  const cursorRow = useRef(0); // current row
  const cursorCol = useRef(0); // current column
  // screen.current content array
  const screen = useRef([['']]);
  // replace carriage return and newline characters in the text
  // let input = inputStr.replace(/\r\n/g, '\n')

  const removeBrackets = (str: string) => {
    return str?.replace?.(/^\(\.*?\)/, '');
  };

  const setId = () => {
    uidRef.current += 1;
    return uidRef.current;
  };

  // handle the \r and \n characters in the text
  const handleText = (text: string) => {
    for (let char of text) {
      if (char === '\r') {
        cursorCol.current = 0; // move to the beginning of the line
      } else if (char === '\n') {
        cursorRow.current += 1; // move to the next line
        cursorCol.current = 0; // move to the beginning of the line
        screen.current[cursorRow.current] = screen.current[
          cursorRow.current
        ] || ['']; // create a new line if it does not exist
      } else {
        // add the character to the screen.current content array
        screen.current[cursorRow.current][cursorCol.current] = char;
        cursorCol.current += 1;
      }
    }
  };

  // ANSI
  const controlSeqRegex = /\x1b\[(\d*);?(\d*)?([A-DJKHfm])/g;

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

  const updateResult = () => {
    let res = [];
    for (let row = 0; row < screen.current.length; row++) {
      console.log('screen.current[row]', screen.current[row]);
      let rowContent = screen.current[row].join('');
      res.push({
        content: removeBrackets(rowContent),
        uid: setId()
      });
    }
    console.log('res', res);
    setResult(res);
  };

  const handleLine = (line: string) => {
    let match;
    let lastIndex = 0;
    let currentStyle = ''; // current text style
    // match ANSI control characters
    while ((match = controlSeqRegex.exec(line)) !== null) {
      // handle text before the control character
      let textBeforeControl = line.slice(lastIndex, match.index);

      handleText(textBeforeControl); // add the processed text to the output
      lastIndex = controlSeqRegex.lastIndex; // update the last index

      const n = parseInt(match[1], 10) || 1;
      const m = parseInt(match[2], 10) || 1;
      const command = match[3];

      // handle ANSI control characters
      switch (command) {
        case 'A': // up
          cursorRow.current = Math.max(0, cursorRow.current - n);
          break;
        case 'B': // down
          cursorRow.current += n;
          break;
        case 'C': // right
          cursorCol.current += n;
          break;
        case 'D': // left
          cursorCol.current = Math.max(0, cursorCol.current - n);
          break;
        case 'H': // move the cursor to the specified position (n, m)
          cursorRow.current = Math.max(0, n - 1);
          cursorCol.current = Math.max(0, m - 1);
          break;
        case 'J': // clear the screen.current
          if (n === 2) {
            screen.current = [['']];
            cursorRow.current = 0;
            cursorCol.current = 0;
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

      // check if the row and column are within the screen.current content array
      while (screen.current.length <= cursorRow.current) {
        screen.current.push(['']);
      }
      while (screen.current[cursorRow.current].length <= cursorCol.current) {
        screen.current[cursorRow.current].push('');
      }
    }
    handleText(line.slice(lastIndex));
    updateResult();
  };

  return {
    handleLine,
    result
  };
};

export default usePaseByLine;
