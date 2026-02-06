/**
 * Generates a simple XPath for a given node.
 */
export function getXPath(node: Node): string {
  // Element nodes with an ID are a shortcut
  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).id) {
    return `//*[@id="${(node as Element).id}"]`;
  }

  // The body element is a standard base case
  if (node === document.body) {
    return "/html/body";
  }

  // If there's no parent, we can't continue
  if (!node.parentNode) {
    return "";
  }

  let ix = 1; // XPath indices are 1-based
  let sibling = node.previousSibling;

  while (sibling) {
    // Check for siblings of the same type and tag name
    if (
      sibling.nodeType === node.nodeType &&
      sibling.nodeName === node.nodeName
    ) {
      ix++;
    }
    sibling = sibling.previousSibling;
  }

  const nodeName =
    node.nodeName.toLowerCase() === "#text"
      ? "text()"
      : node.nodeName.toLowerCase();

  return `${getXPath(node.parentNode)}/${nodeName}[${ix}]`;
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
