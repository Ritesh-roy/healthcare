import type { FhirClient } from "./client";

// Stub for the real FHIR R4 REST client.
// Wire VITE_HEALIX_FHIR_MODE=rest + VITE_HEALIX_FHIR_BASE_URL + VITE_HEALIX_FHIR_TOKEN
// to switch on. Intentionally not implemented yet; throws so any premature use is loud.
export function createRestFhirClient(_config: {
  baseUrl: string;
  token?: string;
}): FhirClient {
  const notImpl = (method: string) => {
    throw new Error(
      `[HEALIX] FHIR REST client method "${method}" is not implemented yet. ` +
        `Wire it in src/lib/healix/fhir/rest-client.ts when the real FHIR endpoint is ready.`,
    );
  };

  return new Proxy({} as FhirClient, {
    get(_t, prop) {
      return () => notImpl(String(prop));
    },
  });
}