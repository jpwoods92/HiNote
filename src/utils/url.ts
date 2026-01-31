export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.hash = "";
    urlObj.search = "";
    return urlObj.toString();
  } catch {
    // if it's not a valid url, return it as is
    return url;
  }
}
