// ============================================================================
// OpenAI-compatible provider adapter
//
// Serves every endpoint that speaks the OpenAI Chat Completions wire format:
// OpenAI direct, OpenRouter, DeepSeek, Groq, Together, vLLM, Ollama, …
// When the base URL is OpenRouter and fallback models are configured, the
// request is routed with a `models` array (not in the OpenAI SDK types, but
// accepted by the API) so OpenRouter retries the next model automatically.
// ============================================================================

import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions'
import { createAIClient, supportsModelRouting } from '../config'
import type { ChatProvider, ChatRequestParams } from './types'

function baseBody(params: ChatRequestParams): Record<string, unknown> {
  const [primary, ...fallbacks] = params.models

  const body: Record<string, unknown> = {
    max_tokens: params.maxTokens,
    messages: params.messages,
  }

  if (supportsModelRouting() && fallbacks.length > 0) {
    body.models = params.models
  } else {
    body.model = primary
  }

  if (params.tools) {
    body.tools = params.tools
  }

  return body
}

export const openAICompatibleProvider: ChatProvider = {
  async createChatStream(params, signal) {
    const client = createAIClient()
    const body = {
      ...baseBody(params),
      stream: true,
      ...(params.includeUsage ? { stream_options: { include_usage: true } } : {}),
    } as unknown as ChatCompletionCreateParamsStreaming
    return client.chat.completions.create(body, { signal })
  },

  async createChatCompletion(params, signal) {
    const client = createAIClient()
    const body = {
      ...baseBody(params),
      stream: false,
    } as unknown as ChatCompletionCreateParamsNonStreaming
    return client.chat.completions.create(body, { signal })
  },
}
