export type UrlCaptureResult =
  | {
      status: "unavailable";
      title: string;
      message: string;
      fallback: string;
    }
  | {
      status: "extension-ready";
      title: string;
      message: string;
      fallback: string;
    };

export interface ScreenshotProvider {
  id: string;
  label: string;
  capture: (url: string) => Promise<UrlCaptureResult>;
}

export const browserUrlProvider: ScreenshotProvider = {
  id: "browser-url",
  label: "Browser URL capture",
  async capture(url: string) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        status: "unavailable",
        title: "Enter a valid URL",
        message: "The URL needs to include a protocol such as https://.",
        fallback: "Paste or upload a screenshot instead."
      };
    }

    if (typeof window !== "undefined" && parsedUrl.origin === window.location.origin) {
      return {
        status: "extension-ready",
        title: "Same-origin URL detected",
        message: "This app keeps URL capture behind an adapter so an extension can provide a real browser screenshot later.",
        fallback: "For now, capture the page manually and upload the image."
      };
    }

    return {
      status: "unavailable",
      title: "URL capture is limited in the browser",
      message: "A normal web page cannot capture arbitrary external sites without a browser extension or screen-capture permission.",
      fallback: "Upload, drag, or paste a screenshot to run the local audit."
    };
  }
};
