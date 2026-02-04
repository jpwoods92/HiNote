import { type Note } from "../../db";
import {
  onMessage,
  sendMessage,
  Message,
  ScrollToHighlightPayload,
  RemoveHighlightPayload,
  EnterRelinkModePayload,
  GetNotesForUrlPayload,
  GetNotePayload,
  GetNoteResponse,
} from "../../utils/messaging";
import { normalizeUrl } from "../../utils/url";
import {
  getXPath,
  getNodeByXPath,
  highlightRange as highlightRangeUtil,
  findRangeByFuzzyMatch,
  getContext,
} from "../../utils/dom";
import { eventBus } from "../../utils/eventBus";
import { Settings } from "../../utils/settings";

export class HighlightManager {
  constructor() {
    void this.initialize();
  }

  async initialize() {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#ext-focus=")) {
        const id = hash.substring("#ext-focus=".length);
        this.scrollToHighlight(id);
        window.location.hash = "";
      }
    };

    // Listen for messages from the side panel
    onMessage(
      (
        message: Message<
          | ScrollToHighlightPayload
          | RemoveHighlightPayload
          | EnterRelinkModePayload
          | Settings
        >,
      ) => {
        switch (message.type) {
          case "SCROLL_TO_HIGHLIGHT":
            this.scrollToHighlight(
              (message.payload as ScrollToHighlightPayload).id,
            );
            break;
          case "REMOVE_HIGHLIGHT":
            this.removeHighlight(
              (message.payload as RemoveHighlightPayload).id,
            );
            break;
          case "ENTER_RELINK_MODE":
            void this.enterRelinkMode(
              (message.payload as EnterRelinkModePayload).id,
            );
            break;
          case "SETTINGS_UPDATED":
            if (message.payload) {
              const settings = message.payload as Settings;
              localStorage.setItem("settings", JSON.stringify(settings));
              eventBus.emit("settings-updated-internal");
            }
            break;
        }
      },
    );

    // Apply initial settings
    try {
      const storedSettings = localStorage.getItem("settings");
      if (storedSettings) {
        // const settings: Settings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("Error reading initial settings from localStorage:", error);
    }

    // Re-hydrate on load
    await this.restoreHighlights();

    // Handle initial hash
    handleHash();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHash);

    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        void this.restoreHighlights();
      }
    }).observe(document, { subtree: true, childList: true });
  }



  /**
   * Creates a highlight from the current selection, saves it, and paints it.
   * @param content Optional note content
   * @param range Optional range to highlight (defaults to current selection)
   */
  async createHighlight(content?: string, range?: Range, color = "yellow") {
    let targetRange = range;

    if (!targetRange) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      targetRange = selection.getRangeAt(0);
    }

    const text = targetRange.toString();
    if (!text.trim()) return;

    const id = crypto.randomUUID();
    const { prefix, suffix } = getContext(targetRange);
    const xpath = getXPath(targetRange.startContainer);
    const now = Date.now();
    const currentUrl = window.location.href;

    const note: Note = {
      id,
      url: currentUrl,
      normalizedUrl: normalizeUrl(currentUrl),
      createdAt: now,
      updatedAt: now,
      anchor: {
        xpath,
        text,
        quote: text,
        prefix,
        suffix,
        color,
        style: "solid",
      },
      content: {
        text: content || "",
        html: content ? `<p>${content}</p>` : "",
        tags: [],
      },
      isDeleted: false,
      isOrphaned: false,
    };

    // 1. Paint immediately
    const wrappers = highlightRangeUtil(targetRange, id, color);
    wrappers.forEach((wrapper) => {
      this.addHighlightEventListeners(wrapper, id);
    });

    // 2. Clear selection for feedback
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // 3. Persist
    await sendMessage({
      type: "CREATE_NOTE",
      payload: note,
    });
    console.log("Highlight saved:", id);
  }

  /**
   * Restores highlights for the current URL from IndexedDB.
   */
  async restoreHighlights() {
    const currentUrl = window.location.href;
    const notes: Note[] = await sendMessage<GetNotesForUrlPayload, Note[]>({
      type: "GET_NOTES_FOR_URL",
      payload: { url: currentUrl },
    });

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
        const wrappers = highlightRangeUtil(range, note.id, note.anchor.color);
        wrappers.forEach((wrapper) => {
          this.addHighlightEventListeners(wrapper, note.id);
        });
        if (note.isOrphaned) {
          void sendMessage({
            type: "UPDATE_NOTE_STATUS",
            payload: { id: note.id, isOrphaned: false },
          });
        }
      } else {
        console.warn("Orphaned Note:", note.id, note.anchor.text);
        if (!note.isOrphaned) {
          void sendMessage({
            type: "UPDATE_NOTE_STATUS",
            payload: { id: note.id, isOrphaned: true },
          });
        }
      }
    }
  }

  /**
   * Scrolls the page to the given highlight.
   */
  scrollToHighlight(id: string) {
    const highlight = document.querySelector(`[data-highlight-id="${id}"]`);
    if (highlight) {
      highlight.scrollIntoView({ behavior: "smooth", block: "center" });
      // Flash the highlight
      highlight.classList.add("ext-flash-focus");
      setTimeout(() => {
        highlight.classList.remove("ext-flash-focus");
      }, 2000);
    } else {
      this.showToast("Unable to locate highlight on this page.");
    }
  }

  showToast(message: string) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "999999";
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }

  /**
   * Removes a highlight from the DOM.
   */
  removeHighlight(id: string) {
    const highlights = document.querySelectorAll(`[data-highlight-id="${id}"]`);
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode;
      if (parent) {
        while (highlight.firstChild) {
          parent.insertBefore(highlight.firstChild, highlight);
        }
        parent.removeChild(highlight);
      }
    });
  }

  /**
   * Enters re-link mode.
   */
  async enterRelinkMode(id: string) {
    const note: GetNoteResponse = await sendMessage<
      GetNotePayload,
      GetNoteResponse
    >({
      type: "GET_NOTE",
      payload: { id },
    });
    if (!note) return;

    document.body.style.cursor = "crosshair";
    const toast = document.createElement("div");
    toast.textContent = "Select text to re-attach note...";
    toast.style.position = "fixed";
    toast.style.top = "10px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "rgba(0,0,0,0.7)";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "99999";
    document.body.appendChild(toast);

    const handleSelection = async () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const text = range.toString();
        if (text.trim()) {
          const { prefix, suffix } = getContext(range);
          const xpath = getXPath(range.startContainer);
          const newAnchor = {
            ...note.anchor,
            xpath,
            text,
            quote: text,
            prefix,
            suffix,
          };
          await sendMessage({
            type: "UPDATE_NOTE_ANCHOR",
            payload: { id, anchor: newAnchor },
          });
          const wrappers = highlightRangeUtil(range, id, note.anchor.color);
          wrappers.forEach((wrapper) => {
            this.addHighlightEventListeners(wrapper, id);
          });
          void sendMessage({
            type: "RELINK_SUCCESS",
            payload: { id },
          });
          document.body.style.cursor = "default";
          document.body.removeChild(toast);
        }
      }
    };
    window.addEventListener(
      "mouseup",
      () => {
        void handleSelection();
      },
      { once: true },
    );
  }

  addHighlightEventListeners(wrapper: HTMLElement, id: string) {
    wrapper.addEventListener("mouseover", async (e) => {
      // Cluster logic based on bounding box overlap
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const overlappingIds = new Set<string>();

      document.querySelectorAll(".ext-highlight").forEach((el) => {
        if (el === wrapper) return;
        const otherRect = el.getBoundingClientRect();
        const overlap = !(
          rect.right < otherRect.left ||
          rect.left > otherRect.right ||
          rect.bottom < otherRect.top ||
          rect.top > otherRect.bottom
        );

        const otherId = (el as HTMLElement).dataset.highlightId;
        if (overlap && otherId) {
          overlappingIds.add(otherId);
        }
      });

      overlappingIds.add(id);

      if (overlappingIds.size > 1) {
        const notesForCluster: Note[] = [];
         for (const noteId of overlappingIds) {
          const note = await sendMessage<GetNotePayload, GetNoteResponse>({
            type: "GET_NOTE",
            payload: { id: noteId },
          });
          if (note) {
            notesForCluster.push(note);
          }
        }
        const event = new CustomEvent("show-cluster-bubbles", {
          detail: {
            notes: notesForCluster,
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY - 30,
          },
        });
        document.dispatchEvent(event);
      }
    });

    wrapper.addEventListener("mouseout", () => {
      setTimeout(() => {
        const stillHovered = document.querySelector(".ext-highlight:hover");
        if (!stillHovered) {
            const event = new CustomEvent("hide-cluster-bubbles");
            document.dispatchEvent(event);
        }
      }, 50);
    });

    wrapper.addEventListener("click", (e) => {
      const overlapping =
        document.querySelectorAll(".ext-highlight:hover").length > 1;
      if (!overlapping) {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const event = new CustomEvent("open-highlight-editor", {
          detail: {
            noteId: id,
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY - 30,
          },
        });
        document.dispatchEvent(event);
      }
    });
  }
}

export const highlightManager = new HighlightManager();
