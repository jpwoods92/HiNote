import { db } from "../db";

export async function exportData() {
  const notes = await db.notes.toArray();
  const pages = await db.pages.toArray();

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    pages,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `highlight-note-backup-${date}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const data = JSON.parse(text);

      if (data.version !== 1) {
        alert("Invalid backup file version.");
        return;
      }

      const confirmed = window.confirm(
        "This will overwrite all existing notes and pages. Are you sure you want to continue?",
      );

      if (confirmed) {
        await db.transaction("rw", db.notes, db.pages, async () => {
          await db.notes.clear();
          await db.pages.clear();
          await db.notes.bulkAdd(data.notes);
          await db.pages.bulkAdd(data.pages);
        });
        alert("Import successful!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data. See console for details.");
    }
  };
  input.click();
}
