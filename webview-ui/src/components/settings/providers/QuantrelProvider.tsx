import { Mode } from "@shared/storage/types"
import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ModelInfoView } from "../common/ModelInfoView"
import { normalizeApiConfiguration } from "../utils/providerUtils"
import { useApiConfigurationHandlers } from "../utils/useApiConfigurationHandlers"

/**
 * Props for the QuantrelProvider component
 */
interface QuantrelProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

/**
 * The Quantrel provider configuration component
 */
export const QuantrelProvider = ({ showModelOptions, isPopup, currentMode }: QuantrelProviderProps) => {
	const { apiConfiguration } = useExtensionState()
	const { handleFieldChange, handleModeFieldChange } = useApiConfigurationHandlers()

	const [modelId, setModelId] = useState(
		currentMode === "plan"
			? apiConfiguration?.planModeQuantrelModelId || "anthropic/claude-3-5-sonnet"
			: apiConfiguration?.actModeQuantrelModelId || "anthropic/claude-3-5-sonnet",
	)

	// Get the normalized configuration
	const { selectedModelInfo } = normalizeApiConfiguration(apiConfiguration, currentMode)

	return (
		<div>
			<div style={{ marginBottom: "10px" }}>
				<p style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)", marginBottom: "5px" }}>
					Quantrel gives you access to 500+ AI models through a single authentication.
				</p>
			</div>

			<div style={{ marginBottom: "15px" }}>
				<label htmlFor="quantrel-base-url" style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>
					Quantrel Backend URL
				</label>
				<VSCodeTextField
					id="quantrel-base-url"
					onInput={(e: any) => handleFieldChange("quantrelBaseUrl", e.target.value)}
					placeholder="http://localhost:8080"
					style={{ width: "100%" }}
					value={apiConfiguration?.quantrelBaseUrl || "http://localhost:8080"}
				/>
			</div>

			{showModelOptions && (
				<>
					<div style={{ marginBottom: "15px" }}>
						<label htmlFor="quantrel-model-id" style={{ display: "block", marginBottom: "5px", fontSize: "13px" }}>
							Model ID
						</label>
						<VSCodeTextField
							id="quantrel-model-id"
							onInput={(e: any) => {
								const value = e.target.value
								setModelId(value)
								handleModeFieldChange(
									{ plan: "planModeQuantrelModelId", act: "actModeQuantrelModelId" },
									value,
									currentMode,
								)
							}}
							placeholder="anthropic/claude-3-5-sonnet"
							style={{ width: "100%" }}
							value={modelId}
						/>
						<p style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)", marginTop: "3px" }}>
							Example: anthropic/claude-3-5-sonnet, openai/gpt-4, etc.
						</p>
					</div>

					<div style={{ marginBottom: "15px" }}>
						<VSCodeButton
							onClick={() => {
								// Trigger the quantrel.selectModel command
								;(window as any).vscode?.postMessage({
									type: "executeCommand",
									command: "quantrel.selectModel",
								})
							}}>
							Browse Model Marketplace
						</VSCodeButton>
						<p style={{ fontSize: "11px", color: "var(--vscode-descriptionForeground)", marginTop: "3px" }}>
							Choose from 500+ AI models
						</p>
					</div>

					<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={modelId} />
				</>
			)}

			<div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid var(--vscode-widget-border)" }}>
				<p style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)", marginBottom: "10px" }}>
					Authentication
				</p>
				<VSCodeButton
					onClick={() => {
						// Trigger the quantrel.login command
						;(window as any).vscode?.postMessage({
							type: "executeCommand",
							command: "quantrel.login",
						})
					}}>
					Login to Quantrel
				</VSCodeButton>
				<VSCodeButton
					appearance="secondary"
					onClick={() => {
						// Trigger the quantrel.logout command
						;(window as any).vscode?.postMessage({
							type: "executeCommand",
							command: "quantrel.logout",
						})
					}}
					style={{ marginLeft: "10px" }}>
					Logout
				</VSCodeButton>
			</div>
		</div>
	)
}
