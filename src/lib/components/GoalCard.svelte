<script lang="ts">
	import type { GoalSchema, TaskSchema } from '$lib/schemas';
	import type { z } from 'zod';
	import { _ } from 'svelte-i18n';

	let {
		title,
		goals,
		type = 'short',
		onGetTasks = null,
		loadingTasks = {},
		objectiveName = ''
	} = $props<{
		title: string;
		goals: z.infer<typeof GoalSchema>[];
		type?: 'short' | 'medium' | 'long';
		onGetTasks?: ((goal: string) => Promise<void>) | null;
		loadingTasks?: Record<string, boolean>;
		objectiveName?: string;
	}>();
</script>

<div class="rounded-2xl bg-slate-800 p-6 shadow-lg">
	<h3 class="mt-0 text-xl text-purple-400">{title}</h3>
	<ul class="mt-4 space-y-3">
		{#if goals.length > 0}
			{#each goals as goal}
				<li class="rounded-lg bg-slate-700 p-3 text-white">
					<div class="flex flex-col gap-2">
						<div class="flex items-start justify-between">
							<span>{goal.action}</span>
							{#if type === 'short' && onGetTasks && goal.tasks.length === 0}
								<button
									class="ml-2 rounded-lg bg-purple-500 px-3 py-1 text-sm transition-colors hover:bg-purple-600"
									onclick={() => onGetTasks(goal.action)}
									disabled={loadingTasks[`${objectiveName}-${goal.action}`]}
								>
									{loadingTasks[`${objectiveName}-${goal.action}`] ? '...' : $_('goals.getTasks')}
								</button>
							{/if}
						</div>

						{#if type === 'short' && goal.tasks.length > 0}
							<div class="mt-2 rounded-lg bg-slate-600 p-3">
								<h4 class="mb-2 text-sm font-semibold text-purple-300">
									{$_('goals.actionableTasks')}
								</h4>
								<ul class="space-y-2">
									{#each goal.tasks as task}
										<li class="flex flex-col gap-1 rounded bg-slate-500 p-2 text-sm">
											<span>{task.description}</span>
											<div class="flex gap-2 text-xs">
												<span class="rounded bg-blue-600 px-2 py-0.5">
													{$_('goals.difficulty', { values: { level: task.difficulty_level } })}
												</span>
												<span class="rounded bg-purple-600 px-2 py-0.5">
													{$_('goals.time', { values: { duration: task.estimated_time } })}
												</span>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</li>
			{/each}
		{:else}
			<li class="text-slate-400">{$_('goals.noGoals', { values: { type: type } })}</li>
		{/if}
	</ul>
</div>
