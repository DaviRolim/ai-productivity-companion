<script lang="ts">
  import type { z } from 'zod';
  import type { TaskSchema } from '$lib/schemas';
  import { _ } from 'svelte-i18n';
  import { slide } from 'svelte/transition';
  
  type Task = z.infer<typeof TaskSchema>;
  type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
  
  let { task } = $props<{
    task: Task;
  }>();
  
  const difficultyColors: Record<DifficultyLevel, string> = {
    'Easy': 'bg-green-700',
    'Medium': 'bg-yellow-600',
    'Hard': 'bg-red-700'
  };

  let isEditing = $state(false);
  let editedDescription = $state(task.description);
  let editedDifficulty = $state(task.difficulty_level);
  let editedTime = $state(task.estimated_time);
  let isExpanded = $state(false);

  async function handleDelete() {
    if (!confirm($_('tasks.deleteConfirm'))) return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert($_('tasks.deleteError'));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert($_('tasks.deleteError'));
    }
  }

  async function handleUpdate() {
    if (editedDescription.trim() === '') return;
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editedDescription,
          difficulty_level: editedDifficulty,
          estimated_time: editedTime
        })
      });
      
      if (response.ok) {
        task.description = editedDescription;
        task.difficulty_level = editedDifficulty;
        task.estimated_time = editedTime;
        isEditing = false;
      } else {
        alert($_('tasks.updateError'));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      alert($_('tasks.updateError'));
    }
  }

  function cancelEditing() {
    isEditing = false;
    editedDescription = task.description;
    editedDifficulty = task.difficulty_level;
    editedTime = task.estimated_time;
  }
</script>

<div class="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50" transition:slide>
  {#if isEditing}
    <div class="p-4">
      <div class="flex flex-col gap-4">
        <textarea
          bind:value={editedDescription}
          class="w-full bg-slate-700 text-white px-4 py-3 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[100px] resize-none"
          placeholder={$_('tasks.description')}
        ></textarea>
        <div class="flex gap-3">
          <select
            bind:value={editedDifficulty}
            class="flex-1 bg-slate-700 text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="Easy">{$_('tasks.difficultyEasy')}</option>
            <option value="Medium">{$_('tasks.difficultyMedium')}</option>
            <option value="Hard">{$_('tasks.difficultyHard')}</option>
          </select>
          <input
            type="text"
            bind:value={editedTime}
            class="flex-1 bg-slate-700 text-white px-4 py-2 rounded-xl border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder={$_('tasks.estimatedTime')}
          />
        </div>
        <div class="flex justify-end gap-3">
          <button
            onclick={handleUpdate}
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl transition-all transform hover:scale-105 font-medium"
          >
            {$_('tasks.save')}
          </button>
          <button
            onclick={cancelEditing}
            class="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
          >
            {$_('tasks.cancel')}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="p-4">
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <div class="flex items-start gap-3">
            <button
              class="text-white opacity-75 hover:opacity-100 transition-opacity mt-1"
              onclick={() => isExpanded = !isExpanded}
              aria-label={isExpanded ? 'Show less' : 'Show more'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="space-y-2">
              <p class="text-white {isExpanded ? '' : 'line-clamp-2'}">{task.description}</p>
              <div class="flex flex-wrap gap-2">
                <span class={`${difficultyColors[task.difficulty_level as DifficultyLevel]} text-xs px-3 py-1 rounded-lg font-medium`}>
                  {task.difficulty_level}
                </span>
                <span class="bg-blue-600 text-xs px-3 py-1 rounded-lg font-medium">
                  ⏱️ {task.estimated_time}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-start gap-2 shrink-0">
          <button
            onclick={() => isEditing = true}
            class="text-gray-400 hover:text-purple-400 transition-colors p-2 hover:bg-purple-500/10 rounded-lg"
            title={$_('tasks.edit')}
            aria-label={$_('tasks.edit')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
          <button
            onclick={handleDelete}
            class="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
            title={$_('tasks.delete')}
            aria-label={$_('tasks.delete')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div> 