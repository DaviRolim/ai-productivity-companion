<script lang="ts">
  import type { ObjectiveSchema, TaskSchema } from '$lib/schemas';
  import type { z } from 'zod';
  import GoalCard from './GoalCard.svelte';
  import TaskCard from './TaskCard.svelte';
  import { _ } from 'svelte-i18n';
  import { slide } from 'svelte/transition';
  
  type Objective = z.infer<typeof ObjectiveSchema>;
  type Task = z.infer<typeof TaskSchema>;
  
  let {
    objective,
    loadingTasks,
    onGetTasks
  } = $props<{
    objective: Objective;
    loadingTasks: Record<string, boolean>;
    onGetTasks: (objective: string, goal: string) => Promise<void>;
  }>();

  let isEditing = $state(false);
  let editedName = $state(objective.name);
  let isExpanded = $state(true);

  async function handleDelete() {
    if (!confirm($_('goals.deleteConfirm'))) return;
    
    try {
      const response = await fetch(`/api/objectives/${objective.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert($_('goals.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete objective:', error);
      alert($_('goals.deleteError'));
    }
  }

  async function handleUpdate() {
    if (editedName.trim() === '') return;
    
    try {
      const response = await fetch(`/api/objectives/${objective.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editedName })
      });
      
      if (response.ok) {
        isEditing = false;
        objective.name = editedName;
      } else {
        alert($_('goals.updateError'));
      }
    } catch (error) {
      console.error('Failed to update objective:', error);
      alert($_('goals.updateError'));
    }
  }
</script>

<div class="bg-slate-800/50 rounded-2xl shadow-xl overflow-hidden">
  <div class="p-6 border-b border-slate-700">
    <div class="flex items-center justify-between">
      {#if isEditing}
        <div class="flex items-center gap-3 flex-1">
          <input
            type="text"
            bind:value={editedName}
            class="flex-1 bg-slate-700 text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onclick={handleUpdate}
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 font-medium"
          >
            Save
          </button>
          <button
            onclick={() => {
              isEditing = false;
              editedName = objective.name;
            }}
            class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      {:else}
        <div class="flex items-center gap-4">
          <button
            class="text-white opacity-75 hover:opacity-100 transition-opacity"
            onclick={() => isExpanded = !isExpanded}
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform transition-transform {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h2 class="text-2xl font-bold text-purple-400">{objective.name}</h2>
        </div>
        <div class="flex items-center gap-3">
          <button
            onclick={() => isEditing = true}
            class="text-gray-400 hover:text-purple-400 transition-colors p-2 hover:bg-purple-500/10 rounded-lg"
            title={$_('goals.edit')}
            aria-label={$_('goals.edit')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onclick={handleDelete}
            class="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
            title={$_('goals.delete')}
            aria-label={$_('goals.delete')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
  
  {#if isExpanded}
    <div class="p-6" transition:slide>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-8">
          <div>
            <h3 class="text-xl font-semibold text-purple-400 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              {$_('goals.shortTerm')}
            </h3>
            <GoalCard
              goals={objective.short_term}
              type="short"
              onGetTasks={(goal) => onGetTasks(objective.name, goal)}
              {loadingTasks}
              objectiveName={objective.name}
            />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-purple-400 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
              </svg>
              {$_('goals.mediumTerm')}
            </h3>
            <GoalCard
              goals={objective.medium_term}
              type="medium"
            />
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-purple-400 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            {$_('goals.longTerm')}
          </h3>
          <GoalCard
            goals={objective.long_term}
            type="long"
          />
        </div>
      </div>
    </div>
  {/if}
</div> 