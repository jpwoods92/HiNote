import { useState, useEffect } from "react";
import browser from "webextension-polyfill";

export function useCurrentTab() {
  const [tab, setTab] = useState<browser.Tabs.Tab | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentTab() {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (tabs.length > 0) {
          setTab(tabs[0]);
        } else {
          setError("No active tab found.");
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred.");
        }
      }
    }

    void getCurrentTab();

    const handleTabUpdate = (
      tabId: number,
      changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
      tab: browser.Tabs.Tab,
    ) => {
      if (tab.active && changeInfo.url) {
        setTab(tab);
      }
    };

    const handleTabActivated = (
      activeInfo: browser.Tabs.OnActivatedActiveInfoType,
    ) => {
      void browser.tabs.get(activeInfo.tabId).then(setTab);
    };

    browser.tabs.onUpdated.addListener(handleTabUpdate);
    browser.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
      browser.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  return { tab, error };
}
