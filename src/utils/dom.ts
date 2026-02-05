/**
 * Generates a simple XPath for a given node.
 */
export function getXPath(node: Node): string {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return node.parentNode ? getXPath(node.parentNode) : "";
  }

  const element = node as Element;
  if (element.id && element.id !== "") {
    return `//*[@id="${element.id}"]`;
  }

  if (element === document.body) return "/html/body";
  if (!element.parentNode) return "";

  const siblings = element.parentNode.childNodes;
  let index = 0;

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${
        index + 1
      }]`;
    }
    if (
      sibling.nodeType === Node.ELEMENT_NODE &&
      (sibling as Element).tagName === element.tagName
    ) {
      index++;
    }
  }
  return "";
}

/**
 * Resolves an XPath to a DOM Node.
 */
export function getNodeByXPath(xpath: string): Node | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    return result.singleNodeValue;
  } catch {
    return null;
  }
}

/**
 * Wraps a Range in a span with the given class and ID.
 * Handles ranges spanning multiple nodes.
 */
export function highlightRange(
  range: Range,
  id: string,
  color: string,
  className = "ext-highlight",
): HTMLElement[] {
  if (range.collapsed) {
    return [];
  }

  try {
    // The fast path: if the range is simple, surround it.
    const wrapper = document.createElement("span");
    wrapper.className = className;
    wrapper.dataset.highlightId = id;
    wrapper.style.backgroundColor = color;
    const rangeClone = range.cloneRange();
    rangeClone.surroundContents(wrapper);
    return [wrapper];
  } catch {
    // The slow path: the range is complex, walk it.
    return fallbackHighlight(range, id, color, className);
  }
}

/**
 * Fallback highlighter using the TreeWalker method.
 */
function fallbackHighlight(
  range: Range,
  id: string,
  color: string,
  className = "ext-highlight",
): HTMLElement[] {
  const root = range.commonAncestorContainer;
  const textNodes: Text[] = [];
  const highlights: HTMLElement[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (range.intersectsNode(node)) {
      textNodes.push(node as Text);
    }
  }

  for (const node of textNodes) {
    const rangeToWrap = range.cloneRange();
    rangeToWrap.selectNode(node);

    // Trim the range to the intersection with the original range
    if (node === range.startContainer) {
      rangeToWrap.setStart(node, range.startOffset);
    }
    if (node === range.endContainer) {
      rangeToWrap.setEnd(node, range.endOffset);
    }
    if (rangeToWrap.collapsed) {
      continue;
    }

    const wrapper = document.createElement("span");
    wrapper.className = className;
    wrapper.dataset.highlightId = id;
    wrapper.style.backgroundColor = color;
    highlights.push(wrapper);

    try {
      rangeToWrap.surroundContents(wrapper);
    } catch (err) {
      console.warn("Fallback failed to surround contents", err);
    }
  }
  return highlights;
}

/**
 * Locates a Range based on text context (Fuzzy Matching).
 * This function is more robust than a simple innerText.indexOf search.
 * It walks the DOM text nodes to find a match.
 *
 * @param text The exact text of the highlight.
 * @param scope An optional element to limit the search to. Defaults to document.body.
 */
export function findRangeByFuzzyMatch(
  text: string,
  scope: Node | null = document.body,
): Range | null {
  if (!scope) scope = document.body;

  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const allTextNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    allTextNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  const fullText = allTextNodes.map((node) => node.textContent).join("");
  let startIndex = fullText.indexOf(text);

  // If the exact text is not found, try a more lenient search
  if (startIndex === -1) {
    // This is a common issue: saved text has different whitespace than live DOM.
    // A simple yet effective strategy is to search for a trimmed version.
    const trimmedText = text.trim();
    startIndex = fullText.indexOf(trimmedText);

    if (startIndex === -1) {
      // Even more lenient: remove all whitespace. This can be risky but
      // might be necessary for some sites.
      const noSpaceText = text.replace(/\s+/g, "");
      const noSpaceFullText = fullText.replace(/\s+/g, "");
      const noSpaceIndex = noSpaceFullText.indexOf(noSpaceText);

      if (noSpaceIndex === -1) {
        return null;
      }

      // This is tricky: we have to map the no-space index back to the
      // original fullText index.
      let fullTextIndex = 0;
      let noSpaceCount = 0;
      while (fullTextIndex < fullText.length && noSpaceCount < noSpaceIndex) {
        if (fullText[fullTextIndex].match(/\s/) === null) {
          noSpaceCount++;
        }
        fullTextIndex++;
      }
      startIndex = fullTextIndex;
    }
  }

  const endIndex = startIndex + text.length;

  let startNode: Text | undefined, endNode: Text | undefined;
  let startOffset = 0,
    endOffset = 0;
  let currentIndex = 0;

  for (const node of allTextNodes) {
    const nodeLength = node.textContent?.length || 0;
    if (!startNode && startIndex < currentIndex + nodeLength) {
      startNode = node;
      startOffset = startIndex - currentIndex;
    }
    if (!endNode && endIndex <= currentIndex + nodeLength) {
      endNode = node;
      endOffset = endIndex - currentIndex;
      break;
    }
    currentIndex += nodeLength;
  }

  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    // Final validation
    if (range.toString().trim() === text.trim()) {
      return range;
    }
  }

  return null;
}
