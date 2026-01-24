import { ModelInfo } from "@shared/api"
import { ClineStorageMessage } from "@/shared/messages/content"
import { fetch } from "@/shared/net"
import { ClineTool } from "@/shared/tools"
import { ApiHandler, CommonApiHandlerOptions } from "../index"
import { withRetry } from "../retry"
import { ApiStream, ApiStreamChunk, ApiStreamUsageChunk } from "../transform/stream"

interface QuantrelHandlerOptions extends CommonApiHandlerOptions {
	quantrelAccessToken?: string
	quantrelBaseUrl?: string
	quantrelModelId?: string // The numeric model ID from /api/agents/coding
	quantrelUserId?: string
}

interface QuantrelCompletionRequest {
	modelId: string
	action: QuantrelAction
	content?: string
	files?: QuantrelFile[]
	diagnostics?: QuantrelDiagnostics
	git?: QuantrelGit
	workspace?: QuantrelWorkspace
}

type QuantrelAction =
	| "EXPLAIN"
	| "REFACTOR"
	| "DEBUG"
	| "GENERATE_TESTS"
	| "DOCUMENT"
	| "FIX_ERROR"
	| "COMMIT_MESSAGE"
	| "COMPLETE"
	| "REVIEW"
	| "CHAT"

interface QuantrelFile {
	path?: string
	content?: string
	language?: string
	cursorLine?: number
	selection?: {
		startLine: number
		endLine: number
		selectedText: string
	}
}

interface QuantrelDiagnostics {
	errors?: Array<{
		message: string
		line: number
		severity: string
		source: string
	}>
	warnings?: Array<{
		message: string
		line: number
		severity: string
		source: string
	}>
}

interface QuantrelGit {
	branch?: string
	diff?: string
	stagedFiles?: string[]
}

interface QuantrelWorkspace {
	rootPath?: string
	projectType?: string
	dependencies?: string[]
}

interface QuantrelSSEMessageEvent {
	content: string
}

interface QuantrelSSEDoneEvent {
	finishReason: string
}

interface QuantrelSSEErrorEvent {
	error: string
	message: string
}

export class QuantrelHandler implements ApiHandler {
	private options: QuantrelHandlerOptions
	private abortController?: AbortController

	constructor(options: QuantrelHandlerOptions) {
		this.options = options
	}

	private extractTextFromMessage(message: ClineStorageMessage): string {
		if (typeof message.content === "string") {
			return message.content
		}
		if (Array.isArray(message.content)) {
			return message.content
				.map((block) => {
					if (block.type === "text") {
						return block.text
					}
					return ""
				})
				.filter(Boolean)
				.join("\n")
		}
		return ""
	}

	private inferAction(messages: ClineStorageMessage[], tools?: ClineTool[]): QuantrelAction {
		// Try to infer the action based on the conversation context
		// For now, we'll default to CHAT for general conversation
		// This can be enhanced to detect specific actions based on message patterns

		const lastMessage = messages[messages.length - 1]
		const messageText = this.extractTextFromMessage(lastMessage).toLowerCase()

		// Simple pattern matching to infer action
		if (messageText.includes("explain") || messageText.includes("what does")) {
			return "EXPLAIN"
		}
		if (messageText.includes("refactor") || messageText.includes("improve")) {
			return "REFACTOR"
		}
		if (messageText.includes("debug") || messageText.includes("bug") || messageText.includes("error")) {
			return "DEBUG"
		}
		if (messageText.includes("test") && messageText.includes("generate")) {
			return "GENERATE_TESTS"
		}
		if (messageText.includes("document") || messageText.includes("comment")) {
			return "DOCUMENT"
		}
		if (messageText.includes("fix") && messageText.includes("error")) {
			return "FIX_ERROR"
		}
		if (messageText.includes("commit") || messageText.includes("git")) {
			return "COMMIT_MESSAGE"
		}
		if (messageText.includes("review")) {
			return "REVIEW"
		}

		// Default to CHAT for general conversation
		return "CHAT"
	}

	private transformMessages(
		systemPrompt: string,
		messages: ClineStorageMessage[],
		tools?: ClineTool[],
	): QuantrelCompletionRequest {
		const action = this.inferAction(messages, tools)

		// Combine system prompt and messages into a single content string
		const content = messages
			.map((msg) => this.extractTextFromMessage(msg))
			.filter(Boolean)
			.join("\n\n")

		const request: QuantrelCompletionRequest = {
			modelId: this.options.quantrelModelId || "anthropic/claude-3-5-sonnet",
			action,
			content: content || systemPrompt,
		}

		// TODO: Extract file context, diagnostics, git info from messages
		// This would require analyzing the message structure to find:
		// - File paths and content from tool results
		// - Error messages from diagnostic messages
		// - Git status from version control context

		return request
	}

	@withRetry()
	async *createMessage(systemPrompt: string, messages: ClineStorageMessage[], tools?: ClineTool[]): ApiStream {
		console.log("[QuantrelHandler] createMessage called with options:", {
			hasAccessToken: !!this.options.quantrelAccessToken,
			tokenLength: this.options.quantrelAccessToken?.length,
			tokenPreview: this.options.quantrelAccessToken ? `${this.options.quantrelAccessToken.substring(0, 20)}...` : "NONE",
			baseUrl: this.options.quantrelBaseUrl,
			userId: this.options.quantrelUserId,
			modelId: this.options.quantrelModelId,
		})

		if (!this.options.quantrelAccessToken) {
			throw new Error("Quantrel access token is required")
		}

		const baseUrl =
			this.options.quantrelBaseUrl || "https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io"
		const request = this.transformMessages(systemPrompt, messages, tools)

		console.log("[QuantrelHandler] Making request to:", `${baseUrl}/api/agent/complete`)
		console.log("[QuantrelHandler] Request body:", JSON.stringify(request, null, 2))

		this.abortController = new AbortController()

		try {
			const response = await fetch(`${baseUrl}/api/agent/complete`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "text/event-stream",
					Authorization: `Bearer ${this.options.quantrelAccessToken}`,
					...(this.options.quantrelUserId && { "X-User-Id": this.options.quantrelUserId }),
				},
				body: JSON.stringify(request),
				signal: this.abortController.signal,
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Quantrel API error (${response.status}): ${errorText}`)
			}

			if (!response.body) {
				throw new Error("Response body is null")
			}

			// Parse SSE stream
			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ""
			let hasReceivedData = false

			console.log("[QuantrelHandler] Starting SSE stream parsing")

			while (true) {
				const { done, value } = await reader.read()
				if (done) {
					console.log("[QuantrelHandler] Stream ended, hasReceivedData:", hasReceivedData)
					break
				}

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (!line.trim() || line.startsWith(":")) {
						continue
					}

					if (line.startsWith("event:")) {
						console.log("[QuantrelHandler] Event type:", line)
						// Skip event type line (not needed for parsing)
						continue
					}

					if (line.startsWith("data:")) {
						const data = line.slice(5).trim()
						if (!data) continue

						console.log("[QuantrelHandler] Received data:", data.substring(0, 100))

						try {
							const parsed = JSON.parse(data)

							if (parsed.content) {
								// Message event
								hasReceivedData = true
								const chunk: ApiStreamChunk = {
									type: "text",
									text: parsed.content,
								}
								yield chunk
							} else if (parsed.finishReason) {
								// Done event
								console.log("[QuantrelHandler] Received finishReason:", parsed.finishReason)
								const usageChunk: ApiStreamUsageChunk = {
									type: "usage",
									inputTokens: 0, // Quantrel doesn't provide token counts in this format
									outputTokens: 0,
								}
								yield usageChunk
								return
							} else if (parsed.error) {
								// Error event
								console.error("[QuantrelHandler] Received error:", parsed)
								throw new Error(`Quantrel error: ${parsed.message || parsed.error}`)
							} else {
								console.warn("[QuantrelHandler] Unexpected data format:", parsed)
							}
						} catch (e) {
							if (e instanceof SyntaxError) {
								console.warn("[QuantrelHandler] Failed to parse SSE data:", data)
							} else {
								throw e
							}
						}
					}
				}
			}

			if (!hasReceivedData) {
				console.error("[QuantrelHandler] Stream completed but no data was received")
				throw new Error("No response data received from Quantrel backend")
			}
		} catch (error) {
			if (error.name === "AbortError") {
				throw new Error("Request was aborted")
			}
			throw error
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.quantrelModelId || "anthropic/claude-3-5-sonnet",
			info: {
				maxTokens: 8192,
				contextWindow: 200000,
				supportsPromptCache: false,
				inputPrice: 0.003,
				outputPrice: 0.015,
			},
		}
	}

	abort(): void {
		if (this.abortController) {
			this.abortController.abort()
		}
	}
}
