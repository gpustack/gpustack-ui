import { controlSeqRegex, replaceLineRegex } from './config';

const useParseAnsi = () => {
  const removeBrackets = (str) => str?.replace?.(/^\(…\)/, '');

  const getRowContent = (screen, row) => {
    let rowContent = [];
    let col = 0;
    while (screen.has(`${row},${col}`)) {
      rowContent.push(screen.get(`${row},${col}`));
      col++;
    }
    return rowContent.join('');
  };

  const handleText = function* (text, screen, cursor) {
    for (let char of text) {
      if (char === '\r') {
        cursor.col = 0; // Move to the beginning of the line
      } else if (char === '\n') {
        // Move to the next line
        yield getRowContent(screen, cursor.row);
        cursor.row++;
        cursor.col = 0;
      } else {
        const position = `${cursor.row},${cursor.col}`;
        screen.set(position, char);
        cursor.col++;
      }
    }
  };

  const parseAnsi = function* (inputStr, setId) {
    let cursor = { row: 0, col: 0 };
    const screen = new Map();
    let lastIndex = 0;

    // Replace \r\n with \n
    const input = inputStr.replace(replaceLineRegex, '\n');
    let match;

    while ((match = controlSeqRegex.exec(input)) !== null) {
      const textBeforeControl = input.slice(lastIndex, match.index);
      yield* handleText(textBeforeControl, screen, cursor);
      lastIndex = controlSeqRegex.lastIndex;

      const [_, n = '1', m = '1', command] = match;
      const parsedN = parseInt(n, 10);
      const parsedM = parseInt(m, 10);

      switch (command) {
        case 'A':
          cursor.row = Math.max(0, cursor.row - parsedN);
          break;
        case 'B':
          cursor.row += parsedN;
          break;
        case 'C':
          cursor.col += parsedN;
          break;
        case 'D':
          cursor.col = Math.max(0, cursor.col - parsedN);
          break;
        case 'H':
          cursor.row = Math.max(0, parsedN - 1);
          cursor.col = Math.max(0, parsedM - 1);
          break;
        case 'J':
          if (parsedN === 2) {
            screen.clear();
            cursor.row = 0;
            cursor.col = 0;
          }
          break;
        case 'm':
          // Skipping color handling in this basic example; can be expanded as needed
          break;
      }
    }

    yield* handleText(input.slice(lastIndex), screen, cursor);

    // Yield remaining rows
    for (let row = 0; row <= cursor.row; row++) {
      yield {
        content: removeBrackets(getRowContent(screen, row)),
        uid: setId()
      };
    }
  };

  return { parseAnsi };
};

export default useParseAnsi;
