/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleClientRequest } from "./clientDb";

export function setupFetchInterceptor() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch;

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url;

    // Only intercept requests destined to /api/*
    if (url.includes("/api/")) {
      try {
        const response = await originalFetch(input, init);

        // Standard SPA fallback often returns HTML document (starts with <!DOCTYPE) with status 200/404 for missing paths on platforms like Vercel.
        // Let's examine the response status and content-type.
        const contentType = response.headers.get("content-type") || "";
        const isHtml = contentType.toLowerCase().includes("text/html");

        if (response.status === 404 || response.status === 405 || isHtml) {
          console.warn(`[API Proxy Fallback] Endpoint ${url} returned ${response.status} (HTML: ${isHtml}). Activating local simulation client...`);
          const simulatedResponse = await handleClientRequest(url, init);
          if (simulatedResponse) return simulatedResponse;
        }

        // Check if parsing as JSON is broken (meaning it isn't valid JSON, usually HTML error pages)
        const clone = response.clone();
        try {
          const text = await clone.text();
          if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html") || text.trim().startsWith("The page")) {
            throw new Error("HTML Response detected where JSON was expected");
          }
          // Test JSON deserialization
          JSON.parse(text);
        } catch (e) {
          console.warn(`[API Parsing Fallback] JSON parsing failed for ${url} (probably HTML error). Redirected to local client store.`);
          const simulatedResponse = await handleClientRequest(url, init);
          if (simulatedResponse) return simulatedResponse;
        }

        return response;
      } catch (networkError: any) {
        console.warn(`[API Network Fallback] Connection to ${url} failed because: ${networkError?.message || networkError}. Transitioned to client store.`);
        const simulatedResponse = await handleClientRequest(url, init);
        if (simulatedResponse) {
          return simulatedResponse;
        }
        throw networkError;
      }
    }

    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } catch (e) {
    try {
      window.fetch = customFetch;
    } catch (err) {
      console.error("Failed to intercept window.fetch globally due to environment constraints:", err);
    }
  }

  console.log("🚀 HireWise AI Client-Side Offline Failover Engine Active & Listening.");
}
