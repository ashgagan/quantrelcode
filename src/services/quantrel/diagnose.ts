/**
 * Diagnostic tool for Quantrel integration
 * Run this to check if everything is properly configured
 */

import type { StateManager } from "../../core/storage/StateManager"

export async function diagnoseQuantrelSetup(stateManager: StateManager): Promise<void> {
	console.log("\n=== Quantrel Diagnostic Check ===\n")

	// Check 1: Access Token
	const accessToken = stateManager.getSecretKey("quantrelAccessToken")
	if (!accessToken) {
		console.error("❌ No access token found")
		console.log("   Please login using the 'quantrel.login' command")
		return
	}
	console.log("✅ Access token found:", accessToken.substring(0, 20) + "...")

	// Check 2: Backend URL
	const baseUrl =
		stateManager.getGlobalSettingsKey("quantrelBaseUrl") ||
		"https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io"
	console.log("✅ Backend URL:", baseUrl)

	// Check 3: User Info
	const userId = stateManager.getGlobalSettingsKey("quantrelUserId")
	const userEmail = stateManager.getGlobalSettingsKey("quantrelUserEmail")
	console.log("✅ User ID:", userId || "not set")
	console.log("✅ User Email:", userEmail || "not set")

	// Check 4: Try to fetch models
	console.log("\n🔍 Testing API connectivity...")
	try {
		const response = await fetch(`${baseUrl}/api/agents/coding`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		console.log("   Response status:", response.status, response.statusText)

		if (!response.ok) {
			const errorText = await response.text()
			console.error("❌ Failed to fetch models:")
			console.error("   Status:", response.status)
			console.error("   Error:", errorText)
			return
		}

		const agents = await response.json()
		console.log(`✅ Successfully fetched ${agents.length} models from Quantrel`)

		// Show first 3 models as sample
		if (agents.length > 0) {
			console.log("\n📋 Sample models:")
			agents.slice(0, 3).forEach((agent: any, i: number) => {
				console.log(`   ${i + 1}. ${agent.name} (${agent.publisher})`)
			})
		}
	} catch (error) {
		console.error("❌ Network error:", error instanceof Error ? error.message : String(error))
		console.log("   Make sure the Quantrel backend is running at:", baseUrl)
	}

	console.log("\n=== End of Diagnostic ===\n")
}
