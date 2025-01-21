let bufferedData = '';

const findValidJSONStrings = (inputStr: string) => {
  const validJSONStrings = [];
  let startIndex = 0;

  while (startIndex < inputStr.length) {
    const openingBraceIndex = inputStr.indexOf('{', startIndex);
    if (openingBraceIndex === -1) break; // No more opening braces

    let closingBraceIndex = openingBraceIndex;
    let braceCount = 0;

    // find  couple of braces
    while (closingBraceIndex < inputStr.length) {
      if (inputStr[closingBraceIndex] === '{') {
        braceCount++;
      } else if (inputStr[closingBraceIndex] === '}') {
        braceCount--;
      }
      if (braceCount === 0) {
        break;
      }
      closingBraceIndex++;
    }

    if (braceCount !== 0) {
      //  no matching closing brace
      break;
    }

    const jsonString = inputStr.substring(
      openingBraceIndex,
      closingBraceIndex + 1
    );

    try {
      const parsedData = JSON.parse(jsonString);
      validJSONStrings.push(parsedData);
      startIndex = closingBraceIndex + 1;
    } catch (error) {
      // mabye invalid JSON
      break;
    }
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
