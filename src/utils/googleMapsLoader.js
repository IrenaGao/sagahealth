let loaderPromise = null;

export function loadGoogleMaps({ apiKey, libraries = [] } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key not configured"));
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const libs = Array.from(new Set(libraries)).filter(Boolean);
  const libsParam = libs.length ? `&libraries=${encodeURIComponent(libs.join(","))}` : "";

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-maps-js");
    if (existing) {
      const onLoad = () => resolve(window.google.maps);
      const onError = (e) => {
        loaderPromise = null;
        reject(e instanceof Error ? e : new Error("Failed to load Google Maps script"));
      };

      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}${libsParam}&v=weekly`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (e) => {
      loaderPromise = null;
      reject(e instanceof Error ? e : new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return loaderPromise;
}
