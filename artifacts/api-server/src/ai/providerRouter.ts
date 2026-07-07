import { openai } from "@workspace/integrations-openai-ai-server";
import { COMPLIANCE_SYSTEM_INSTRUCTIONS } from "./compliance";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiTaskKind =
  | "general_assistant"
  | "case_summary"
  | "evidence_analysis"
  | "document_drafting"
  | "legal_research"
  | "citation_verification"
  | "deadline_analysis"
  | "docket_analysis"
  | "administrative_process";

export type ProviderRoute = "openai" | "anthropic_future" | "perplexity_future";

export type ProviderRouterOptions = {
  taskKind: AiTaskKind;
  messages: ChatMessage[];
  model?: string;
  maxCompletionTokens?: number;
  stream?: boolean;
  includeComplianceSystemPrompt?: boolean;
};

export function selectProvider(taskKind: AiTaskKind): ProviderRoute {
  if (taskKind === "legal_research" || taskKind === "citation_verification") {
    return process.env.PERPLEXITY_API_KEY ? "perplexity_future" : "openai";
  }

  if (taskKind === "case_summary" && process.env.ANTHROPIC_API_KEY) {
    return "anthropic_future";
  }

  return "openai";
}

export function withComplianceSystemPrompt(messages: ChatMessage[]): ChatMessage[] {
  const hasSystem = messages.some((message) => message.role === "system");
  if (hasSystem) {
    return messages.map((message) =>
      message.role === "system"
        ? { ...message, content: `${COMPLIANCE_SYSTEM_INSTRUCTIONS}\n\n${message.content}` }
        : message,
    );
  }

  return [{ role: "system", content: COMPLIANCE_SYSTEM_INSTRUCTIONS }, ...messages];
}

export async function createChatCompletion(options: ProviderRouterOptions) {
  const provider = selectProvider(options.taskKind);
  const messages = options.includeComplianceSystemPrompt === false
    ? options.messages
    : withComplianceSystemPrompt(options.messages);

  // Perplexity and Anthropic will be added behind this router in later integration sprints.
  // For now, preserve existing behavior by routing to the current OpenAI integration.
  if (provider !== "openai") {
    // Intentional fallback while providers are not wired yet.
  }

  return openai.chat.completions.create({
    model: options.model ?? "gpt-5.4",
    max_completion_tokens: options.maxCompletionTokens ?? 2048,
    messages,
    stream: options.stream,
  });
}
