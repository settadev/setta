export function splitDocuments(input) {
  // Common YAML document separators
  const separators = [
    "---", // Standard YAML document separator
    "...", // YAML document terminator
    "===", // Alternative separator sometimes used
  ];

  // Trim the input and split into lines
  const lines = input.trim().split("\n");

  let documents = [];
  let currentDoc = [];

  for (let line of lines) {
    const trimmedLine = line.trim();

    // Check if line is a separator
    const isSeparator = separators.some((sep) => trimmedLine === sep);

    if (isSeparator) {
      // Always add current document when we hit a separator,
      // even if it's empty
      documents.push(currentDoc.join("\n"));
      currentDoc = [];
    } else {
      currentDoc.push(line);
    }
  }

  // Always add the final document, even if empty
  documents.push(currentDoc.join("\n"));

  return documents;
}

export function parseRawDump(rawStr) {
  const lines = rawStr.split(/\r?\n/);
  return parseBlock(lines, 0, 0).result;
}

function parseBlock(lines, startIndex, currentIndent) {
  let i = startIndex;
  let result;
  let isList = false;
  let isObj = false;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const indent = leadingSpaces(line);
    if (indent < currentIndent) break;
    const trimmed = line.trim();

    // Check if it's a list item
    const dashIdx = trimmed.indexOf("- ");
    // This also allows just '-' (dash at index 0), so handle that
    if (dashIdx === 0 || trimmed === "-") {
      if (!isList && !isObj) {
        isList = true;
        result = [];
      } else if (isObj) {
        throw new Error("Mixed list and object at same level.");
      }
      // Extract what's after the dash; if there's nothing, afterDash = ''
      const afterDash = trimmed === "-" ? "" : trimmed.slice(2).trim();
      // If afterDash is blank or ends with colon/colon+pipe, we might have a nested block
      if (!afterDash || afterDash.endsWith(":") || afterDash.endsWith(": |")) {
        // Try parsing either a sub-block or empty
        const { parsedValue, isBlock, extraIndent } =
          parsePossibleKeyValue(afterDash);
        if (isBlock) {
          const subBlock = parseBlock(
            lines,
            i + 1,
            currentIndent + extraIndent,
          );
          if (parsedValue === undefined) {
            // Means something like '-'
            if (isEmptyStructure(subBlock.result)) {
              result.push("");
            } else {
              result.push(subBlock.result);
            }
          } else {
            // Means something like '- mykey:'
            if (isEmptyStructure(subBlock.result)) {
              result.push({ [parsedValue]: "" });
            } else {
              result.push({ [parsedValue]: subBlock.result });
            }
          }
          i = subBlock.nextIndex;
        } else {
          // If there's no block, but let's parse a sub-block in case
          const subBlock = parseBlock(lines, i + 1, indent + 2);
          if (isEmptyStructure(subBlock.result)) {
            result.push("");
          } else {
            result.push(subBlock.result);
          }
          i = subBlock.nextIndex;
        }
      } else {
        // It's a single-line item
        result.push(afterDash);
        i++;
      }
    } else {
      // It's an object key
      if (!isObj && !isList) {
        isObj = true;
        result = {};
      } else if (isList) {
        throw new Error("Mixed list and object at same level.");
      }

      const keyMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (!keyMatch) {
        throw new Error(`Line doesn't match "key: value": ${trimmed}`);
      }
      const key = keyMatch[1].trim();
      let remainder = keyMatch[2];

      if (remainder === "|") {
        // Multi-line literal block
        const { textBlock, nextIdx } = gatherBlock(lines, i + 1, indent + 2);
        result[key] = textBlock;
        i = nextIdx;
      } else if (remainder === "") {
        // Could be a nested block or empty
        const subBlock = parseBlock(lines, i + 1, indent + 2);
        // If subBlock is empty structure, treat as ""
        if (isEmptyStructure(subBlock.result)) {
          result[key] = "";
        } else {
          result[key] = subBlock.result;
        }
        i = subBlock.nextIndex;
      } else {
        // Single line
        result[key] = remainder;
        i++;
      }
    }
  }
  if (result === undefined) {
    result = {};
  }
  return { result, nextIndex: i };
}

// Check if we might have a key: (something)
function parsePossibleKeyValue(str) {
  const match = str.match(/^([^:]+):\s*(.*)$/);
  if (!match) {
    return { parsedValue: undefined, isBlock: false, extraIndent: 2 };
  }
  const key = match[1].trim();
  const after = match[2].trim();
  if (!after || after === "|") {
    return { parsedValue: key, isBlock: true, extraIndent: 2 };
  }
  return { parsedValue: undefined, isBlock: false, extraIndent: 2 };
}

// Gather multiline block
function gatherBlock(lines, startIndex, blockIndent) {
  let textBlock = "";
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      if (leadingSpaces(line) < blockIndent) break;
      textBlock += removeIndent(line, blockIndent) + "\n";
      i++;
      continue;
    }
    const indent = leadingSpaces(line);
    if (indent < blockIndent) break;
    textBlock += removeIndent(line, blockIndent) + "\n";
    i++;
  }
  if (textBlock.endsWith("\n")) {
    textBlock = textBlock.slice(0, -1);
  }
  return { textBlock, nextIdx: i };
}

// A small helper to check if a structure is an empty object or empty array
function isEmptyStructure(val) {
  if (Array.isArray(val)) {
    return val.length === 0;
  } else if (typeof val === "object" && val !== null) {
    return Object.keys(val).length === 0;
  }
  return false;
}

function leadingSpaces(str) {
  let count = 0;
  for (let c of str) {
    if (c === " ") count++;
    else break;
  }
  return count;
}

function removeIndent(str, n) {
  let count = 0;
  let out = "";
  for (let c of str) {
    if (count < n && c === " ") count++;
    else out += c;
  }
  return out;
}
