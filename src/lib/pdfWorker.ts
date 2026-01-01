/**
 * PDF.js Worker Configuration
 *
 * Configures the pdf.js worker for react-pdf.
 * This must be imported before any react-pdf components are used.
 */

// Polyfill URL.parse for Safari compatibility
// URL.parse() is a new static method (Chrome 126+, Firefox 126+) not yet in Safari
if (typeof URL.parse !== "function") {
  (URL as unknown as { parse: typeof URL.parse }).parse = function (
    url: string,
    base?: string | URL,
  ): URL | null {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}

import { pdfjs } from "react-pdf";

// Configure the worker to use the bundled version from pdfjs-dist
// This uses Vite's import.meta.url for proper path resolution
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export { pdfjs };
