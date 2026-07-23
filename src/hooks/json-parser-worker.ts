let bufferedData = '';

const findValidJSONStrings = (inputStr: string) => {
  const validJSONStrings = [];
  let startIndex = 0;

  while (startIndex < inputStr.length) {
    const openingBraceIndex = inputStr.indexOf('{', startIndex);
    if (openingBraceIndex === -1) break; // No more opening braces

    // find the matching closing brace, ignoring braces inside string
    // literals (e.g. a state_message containing `{`/`}`)
    let closingBraceIndex = -1;
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = openingBraceIndex; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
      } else if (char === '"') {
        inString = true;
      } else if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          closingBraceIndex = i;
          break;
        }
      }
    }

    if (closingBraceIndex === -1) {
      //  no matching closing brace yet, wait for more data
      break;
    }

    const jsonString = inputStr.substring(
      openingBraceIndex,
      closingBraceIndex + 1
    );

    try {
      const parsedData = JSON.parse(jsonString);
      validJSONStrings.push(parsedData);
    } catch (error) {
      // skip the malformed segment instead of breaking, otherwise it jams
      // the buffer and every later event on this stream is lost
    }
    startIndex = closingBraceIndex + 1;
  }

  return {
    parsedJSON: validJSONStrings,
    remainingData: inputStr.slice(startIndex) // it is the not parsed data
  };
};

// Web Worker
self.onmessage = function (event) {
  bufferedData += event.data;

  const { parsedJSON, remainingData } = findValidJSONStrings(bufferedData);

  if (parsedJSON.length > 0) {
    postMessage(parsedJSON);
  }

  // save  the remaining data for the next message
  bufferedData = remainingData;
};
