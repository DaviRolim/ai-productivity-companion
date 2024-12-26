<script lang="ts">
	import '../app.css';
	import type { ActionPlanSchema } from '$lib/schemas';
	import type { z } from 'zod';
	import type { PageData } from './$types';
	import ChatBox from '$lib/components/ChatBox.svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';

	let { children } = $props();
	let isChatMinimized = $state(false);
	let messages = $state<{ role: string; content: string | ActionPlan }[]>([]);

	type ActionPlan = z.infer<typeof ActionPlanSchema>;

	function toggleChat() {
		isChatMinimized = !isChatMinimized;
	}

	async function handleSubmit(userInput: string) {
		console.log('Submit clicked', { userInput });
		
		const trimmedInput = userInput?.trim();
		if (!trimmedInput) {
			console.log('Empty input, returning');
			return;
		}
		
		try {
			console.log('Sending request...');
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ message: trimmedInput })
			});

			console.log('Got response:', response.status);
			const result = await response.json();
			console.log('Parsed result:', result);
			
			if (result.success) {
				messages = [...messages, 
					{ role: 'user', content: trimmedInput },
					{ role: 'assistant', content: result.response }
				];
				userInput = '';
			} else {
				console.error('Error:', result.error);
				messages = [...messages, 
					{ role: 'system', content: `Error: ${result.error}` }
				];
			}
		} catch (error) {
			console.error('Failed to send message:', error);
			messages = [...messages, 
				{ role: 'system', content: 'Failed to send message. Please try again.' }
			];
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 font-sans">
	<!-- Navigation -->
	<nav class="fixed top-0 left-0 right-0 bg-slate-800 shadow-lg z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<span class="text-2xl font-bold text-purple-400">Productivity Companion</span>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a 
							href="/dashboard"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname === '/dashboard' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-300 hover:text-purple-300'}"
						>
							Dashboard
						</a>
						<a 
							href="/objectives"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname === '/objectives' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-300 hover:text-purple-300'}"
						>
							Objectives
						</a>
						<a 
							href="/insights"
							class="inline-flex items-center px-1 pt-1 text-sm font-medium {$page.url.pathname === '/insights' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-300 hover:text-purple-300'}"
						>
							Insights
						</a>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
		{@render children()}
	</main>

	<ChatBox
		{isChatMinimized}
		{messages}
		onSubmit={handleSubmit}
		onToggle={toggleChat}
	/>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background-color: #1a1b2e;
		color: #e2e2f5;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
