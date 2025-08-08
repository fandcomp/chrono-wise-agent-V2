// Lightweight loader for Google's gapi client library in the browser

const GAPI_SRC = 'https://apis.google.com/js/api.js';

let gapiLoadPromise: Promise<typeof gapi> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var gapi: any;
}

export async function loadGapiClient(): Promise<typeof gapi> {
  if (gapiLoadPromise) return gapiLoadPromise;

  gapiLoadPromise = new Promise((resolve, reject) => {
    // If already loaded
    if (typeof window !== 'undefined' && (window as any).gapi) {
      resolve((window as any).gapi);
      return;
    }

    const script = document.createElement('script');
    script.src = GAPI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).gapi) {
        resolve((window as any).gapi);
      } else {
        reject(new Error('Failed to load gapi'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load gapi script'));
    document.head.appendChild(script);
  });

  return gapiLoadPromise;
}
