<script lang="ts">
  import type { ActionPlanSchema } from '$lib/schemas';
  import type { z } from 'zod';
  import type { PageData } from './$types';
  import ObjectiveSection from '$lib/components/ObjectiveSection.svelte';
  import { _ } from 'svelte-i18n';
  import { updatePlanWithTasks } from '$lib/adapters/current-plan-adapter';

  type ActionPlan = z.infer<typeof ActionPlanSchema>;
  const { data } = $props<{ data: PageData }>();
  let currentPlan = $state<ActionPlan | null>(data.actionPlan);
  let loadingTasks = $state<Record<string, boolean>>({});

  async function getTasksForGoal(objective: string, goal: string) {
    const key = `${objective}-${goal}`;
    if (loadingTasks[key]) return;
    
    loadingTasks[key] = true;
    
    try {
      const response = await fetch('/api/chat/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          objective: objective,
          shortTermGoal: goal
        })
      });

      const result = await response.json();
      
      if (result.success && currentPlan) {
        currentPlan = updatePlanWithTasks(currentPlan, objective, goal, result.tasks);
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Failed to get tasks:', error);
    } finally {
      loadingTasks[key] = false;
    }
  }
</script>

<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex justify-between items-center mb-12">
    <div>
      <h1 class="text-5xl font-bold text-white tracking-tight mb-2">{$_('goals.title')}</h1>
      <p class="text-gray-400 text-lg">Track and manage your objectives and their associated goals</p>
    </div>
    <button class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900">
      <span class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Add Objective
      </span>
    </button>
  </div>
  
  {#if currentPlan?.objectives}
    <div class="space-y-16">
      {#each currentPlan.objectives as objective}
        <ObjectiveSection
          {objective}
          {loadingTasks}
          onGetTasks={getTasksForGoal}
        />
      {/each}
    </div>
  {:else}
    <div class="text-center py-16 bg-slate-800/30 rounded-2xl">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-gray-400 text-xl mb-2">No objectives found</p>
      <p class="text-gray-500">Create your first objective to start tracking your goals!</p>
    </div>
  {/if}
</section> 