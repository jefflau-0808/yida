export function registerServiceWorker(): () => void {
  if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
    return () => undefined;
  }
  const listener = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA registration is an enhancement; the website remains usable.
    });
  };
  window.addEventListener("load", listener, { once: true });
  return () => window.removeEventListener("load", listener);
}
