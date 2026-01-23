import { useState, useEffect } from "react";

export function useCurrentTab() {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTab = async () => {
      try {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (activeTab) {
          setTab(activeTab);
        } else {
          setError("No active tab found");
        }
      } catch (err) {
        setError("Failed to query tabs");
        console.error(err);
      }
    };

    getTab();
  }, []);

  return { tab, error };
}
