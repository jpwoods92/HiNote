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
 * Searches for `prefix + text + suffix` in the document body.
 */
/**
 * Locates a Range based on text context (Fuzzy Matching).
 * This function is more robust than a simple innerText.indexOf search.
 * It walks the DOM text nodes to find a match.
 *
 * @param text The exact text of the highlight.
 * @param prefix The ~30 chars of text content before the highlight.
 * @param suffix The ~30 chars of text content after the highlight.
 * @param scope An optional element to limit the search to. Defaults to document.body.
 */
export function findRangeByFuzzyMatch(
  text: string,
  prefix: string,
  suffix: string,
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

  // First, try a high-confidence match with prefix, text, and suffix
  for (let i = 0; i < allTextNodes.length; i++) {
    const node = allTextNodes[i];
    const textContent = node.textContent || "";

    const fullSearchString = prefix + text + suffix;
    const index = textContent.indexOf(fullSearchString);

    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index + prefix.length);
      range.setEnd(node, index + prefix.length + text.length);
      // Ensure the text actually matches what we expect
      if (range.toString().trim() === text.trim()) {
        return range;
      }
    }
  }

  // Fallback 1: Search for [prefix + text] or [text + suffix] spanning adjacent nodes
  for (let i = 0; i < allTextNodes.length; i++) {
    const node1 = allTextNodes[i];
    const node2 = allTextNodes[i + 1];

    if (node1 && node2) {
      const combinedText =
        (node1.textContent || "") + (node2.textContent || "");

      // Case a: prefix + text
      let index = combinedText.indexOf(prefix + text);
      if (
        index !== -1 &&
        (node1.textContent || "").endsWith(prefix + text.substring(0, 1))
      ) {
        const range = document.createRange();
        const startOffset = (node1.textContent || "").lastIndexOf(prefix);
        if (startOffset !== -1) {
          range.setStart(node1, startOffset + prefix.length);
          range.setEnd(
            node2,
            text.length -
              (node1.textContent.length - (startOffset + prefix.length)),
          );
          if (range.toString().trim() === text.trim()) return range;
        }
      }

      // Case b: text + suffix
      index = combinedText.indexOf(text + suffix);
      if (
        index !== -1 &&
        (node1.textContent || "").endsWith(text.substring(0, 1))
      ) {
        const range = document.createRange();
        range.setStart(node1, index);
        const endOffset =
          (text + suffix).length - (node1.textContent.length - index);
        range.setEnd(node2, endOffset - suffix.length);
        if (range.toString().trim() === text.trim()) return range;
      }
    }
  }

  // Fallback 2: Find just the text itself
  for (let i = 0; i < allTextNodes.length; i++) {
    const node = allTextNodes[i];
    const textContent = node.textContent || "";
    const index = textContent.indexOf(text);

    if (index !== -1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      // Final check: does the text in the new range match?
      if (range.toString().trim() === text.trim()) {
        return range;
      }
    }
  }

  return null;
}

export function getContext(
  range: Range,
  length: number = 30,
): { prefix: string; suffix: string } {
  const preRange = document.createRange();
  preRange.setStartBefore(document.body);
  preRange.setEnd(range.startContainer, range.startOffset);
  const prefix = preRange.toString().slice(-length);

  const postRange = document.createRange();
  postRange.setStart(range.endContainer, range.endOffset);
  postRange.setEndAfter(document.body);
  const suffix = postRange.toString().slice(0, length);

  return { prefix, suffix };
}
