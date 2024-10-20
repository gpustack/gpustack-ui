import { useCallback, useRef } from 'react';

const controlSeqRegex = /\x1b\[(\d*);?(\d*)?([A-DJKHfm])/g;

const useParseAnsi = () => {
  const lastIndex = useRef(0);

  const removeBrackets = useCallback((str: string) => {
    return str?.replace?.(/^\(.*?\)/, '');
  }, []);

  const isClean = useCallback((ansiStr: string) => {
    let input = ansiStr.replace(/\r\n/g, '\n');
    let match = controlSeqRegex.exec(input) || [];
    const command = match?.[3];
    const n = parseInt(match?.[1], 10) || 1;
    return command === 'J' && n === 2;
  }, []);

  const parseAnsi = useCallback(
    (inputStr: string, setId: () => number, clearScreen: () => void) => {
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
        let textBeforeControl = input.slice(lastIndex.current, match.index);
        output += handleText(textBeforeControl); // add the processed text to the output
        lastIndex.current = controlSeqRegex.lastIndex; // update the last index

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
      output += handleText(input.slice(lastIndex.current));

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
    },
    []
  );

  return { parseAnsi, isClean };
};

export default useParseAnsi;
