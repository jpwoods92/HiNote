import { db, type Note } from "../../db";
import {
  getXPath,
  getNodeByXPath,
  highlightRange,
  findRangeByFuzzyMatch,
  getContext,
} from "../../utils/dom";

export class HighlightManager {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Re-hydrate on load
    await this.restoreHighlights();

    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.restoreHighlights();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Creates a highlight from the current selection, saves it, and paints it.
   */
  async createHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = range.toString();
    if (!text.trim()) return;

    const id = crypto.randomUUID();
    const { prefix, suffix } = getContext(range);
    const xpath = getXPath(range.startContainer);

    const note: Note = {
      id,
      url: window.location.href,
      createdAt: Date.now(),
      anchor: {
        xpath,
        text,
        prefix,
        suffix,
        color: "yellow",
      },
    };

    // 1. Paint immediately
    highlightRange(range, id);

    // 2. Clear selection for feedback
    selection.removeAllRanges();

    // 3. Persist
    await db.notes.add(note);
    console.log("Highlight saved:", id);
  }

  /**
   * Restores highlights for the current URL from IndexedDB.
   */
  async restoreHighlights() {
    const notes = await db.notes
      .where("url")
      .equals(window.location.href)
      .toArray();

    for (const note of notes) {
      let range: Range | null = null;

      // Attempt 1: Scoped Fuzzy Match (High accuracy)
      // Try to find the highlight near its original XPath location first.
      const startNode = getNodeByXPath(note.anchor.xpath);
      range = findRangeByFuzzyMatch(
        note.anchor.text,
        note.anchor.prefix,
        note.anchor.suffix,
        startNode,
      );

      // Attempt 2: Global Fuzzy Match (Fallback for changed DOM)
      if (!range) {
        range = findRangeByFuzzyMatch(
          note.anchor.text,
          note.anchor.prefix,
          note.anchor.suffix,
          null, // Search the whole document body
        );
      }

      if (range) {
        highlightRange(range, note.id);
      } else {
        console.warn("Orphaned Note:", note.id, note.anchor.text);
      }
    }
  }
}

export const highlightManager = new HighlightManager();
