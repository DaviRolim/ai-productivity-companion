<script lang="ts">
	import type { GoalSchema, TaskSchema } from '$lib/schemas';
	import type { z } from 'zod';
	import { _ } from 'svelte-i18n';
	import { slide } from 'svelte/transition';
	import TaskCard from './TaskCard.svelte';

	type Task = z.infer<typeof TaskSchema>;
	
	let {
		goals,
		type = 'short',
		onGetTasks = null,
		loadingTasks = {},
		objectiveName = ''
	} = $props<{
		goals: z.infer<typeof GoalSchema>[];
		type?: 'short' | 'medium' | 'long';
		onGetTasks?: ((goal: string) => Promise<void>) | null;
		loadingTasks?: Record<string, boolean>;
		objectiveName?: string;
	}>();

	let editingGoalId = $state<string | null>(null);
	let editedAction = $state('');
	let expandedGoals = $state<Record<string, boolean>>({});

	async function handleDeleteGoal(goalId: string) {
		if (!confirm($_('goals.deleteGoalConfirm'))) return;
		
		try {
			const response = await fetch(`/api/goals/${goalId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				window.location.reload();
			} else {
				alert($_('goals.deleteError'));
			}
		} catch (error) {
			console.error('Failed to delete goal:', error);
			alert($_('goals.deleteError'));
		}
	}

	async function handleUpdateGoal(goalId: string) {
		if (editedAction.trim() === '') return;
		
		try {
			const response = await fetch(`/api/goals/${goalId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ action: editedAction })
			});
			
			if (response.ok) {
				const updatedGoal = goals.find((g: z.infer<typeof GoalSchema>) => g.id === goalId);
				if (updatedGoal) {
					updatedGoal.action = editedAction;
				}
				editingGoalId = null;
			} else {
				alert($_('goals.updateError'));
			}
		} catch (error) {
			console.error('Failed to update goal:', error);
			alert($_('goals.updateError'));
		}
	}

	function startEditing(goal: z.infer<typeof GoalSchema>) {
		editingGoalId = goal.id;
		editedAction = goal.action;
	}

	function cancelEditing() {
		editingGoalId = null;
		editedAction = '';
	}

	function toggleGoal(goalId: string) {
		expandedGoals[goalId] = !expandedGoals[goalId];
		expandedGoals = expandedGoals;
	}
</script>

<div class="space-y-4">
	{#if goals.length > 0}
		{#each goals as goal}
			<div class="bg-slate-700/50 rounded-xl overflow-hidden">
				<div class="p-4">
					{#if editingGoalId === goal.id}
						<div class="flex flex-col gap-3">
							<textarea
								bind:value={editedAction}
								class="w-full bg-slate-600 text-white px-4 py-3 rounded-xl border border-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[100px] resize-none"
								placeholder={$_('goals.action')}
							></textarea>
							<div class="flex justify-end gap-2">
								<button
									onclick={() => handleUpdateGoal(goal.id)}
									class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 font-medium"
								>
									{$_('goals.save')}
								</button>
								<button
									onclick={cancelEditing}
									class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
								>
									{$_('goals.cancel')}
								</button>
							</div>
						</div>
					{:else}
						<div class="flex flex-col gap-4">
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-start gap-3">
										{#if type === 'short' && goal.tasks.length > 0}
											<button
												class="text-white opacity-75 hover:opacity-100 transition-opacity mt-1"
												onclick={() => toggleGoal(goal.id)}
												aria-label={expandedGoals[goal.id] ? 'Collapse tasks' : 'Expand tasks'}
											>
												<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform {expandedGoals[goal.id] ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</button>
										{/if}
										<p class="text-white text-lg">{goal.action}</p>
									</div>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<button
										onclick={() => startEditing(goal)}
										class="text-gray-400 hover:text-purple-400 transition-colors p-2 hover:bg-purple-500/10 rounded-lg"
										title={$_('goals.edit')}
										aria-label={$_('goals.edit')}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
										</svg>
									</button>
									<button
										onclick={() => handleDeleteGoal(goal.id)}
										class="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
										title={$_('goals.delete')}
										aria-label={$_('goals.delete')}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
										</svg>
									</button>
									{#if type === 'short' && onGetTasks && goal.tasks.length === 0}
										<button
											class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
											onclick={() => onGetTasks(goal.action)}
											disabled={loadingTasks[`${objectiveName}-${goal.action}`]}
										>
											{#if loadingTasks[`${objectiveName}-${goal.action}`]}
												<div class="flex items-center gap-2">
													<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
														<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													<span>Generating...</span>
												</div>
											{:else}
												<span class="flex items-center gap-2">
													<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
														<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
													</svg>
													{$_('goals.getTasks')}
												</span>
											{/if}
										</button>
									{/if}
								</div>
							</div>

							{#if type === 'short' && goal.tasks.length > 0 && expandedGoals[goal.id]}
								<div class="mt-4" transition:slide>
									<div class="space-y-3">
										{#each goal.tasks as task}
											<TaskCard 
												{task}
												onTaskUpdate={(updatedTask) => {
													const taskIndex = goal.tasks.findIndex((t: Task) => t.id === updatedTask.id);
													if (taskIndex !== -1) {
														const newTasks = [...goal.tasks];
														newTasks[taskIndex] = updatedTask;
														goal.tasks = newTasks;
													}
												}}
											/>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{:else}
		<div class="text-slate-400 text-center py-8 bg-slate-700/30 rounded-xl">
			{$_('goals.noGoals', { values: { type: type } })}
		</div>
	{/if}
</div>
