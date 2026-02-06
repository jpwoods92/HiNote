import "webextension-polyfill";

declare module "webextension-polyfill" {
  namespace sidePanel {
    function setPanelBehavior(behavior: {
      openPanelOnActionClick: boolean;
    }): Promise<void>;
    function getPanelBehavior(): Promise<{ openPanelOnActionClick: boolean }>;
  }
}
