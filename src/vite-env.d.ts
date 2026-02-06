export declare module "*?worker" {
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

export declare module "webextension-polyfill" {
  namespace browser {
    export const sidePanel: chrome.sidePanel;
  }
}
