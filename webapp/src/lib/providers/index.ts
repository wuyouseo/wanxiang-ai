import { agnesProvider } from "./agnesProvider";
import type { ModelProvider } from "./types";

export type { ModelProvider } from "./types";

// Registry of available model providers. Add future entries here — e.g.
//   registry.openai = openaiProvider;
// — and expose the choice in Settings once there's more than one.
const registry: Record<string, ModelProvider> = {
  agnes: agnesProvider,
};

export function getActiveProvider(_providerId: string = "agnes"): ModelProvider {
  return registry[_providerId] ?? agnesProvider;
}
