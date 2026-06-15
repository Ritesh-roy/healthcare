import { mockFhirClient } from "./mock-client";
import { createRestFhirClient } from "./rest-client";
import type { FhirClient } from "./client";

let _client: FhirClient | null = null;

export function getFhirClient(): FhirClient {
  if (_client) return _client;
  const mode = import.meta.env.VITE_HEALIX_FHIR_MODE;
  if (mode === "rest") {
    _client = createRestFhirClient({
      baseUrl: import.meta.env.VITE_HEALIX_FHIR_BASE_URL ?? "",
      token: import.meta.env.VITE_HEALIX_FHIR_TOKEN,
    });
  } else {
    _client = mockFhirClient;
  }
  return _client;
}

export type { FhirClient } from "./client";
export * from "./types";