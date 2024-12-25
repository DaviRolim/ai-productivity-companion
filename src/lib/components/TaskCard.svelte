<script lang="ts">
  import type { z } from 'zod';
  import type { TaskSchema } from '$lib/schemas';
  
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
</script>

<div class="bg-gray-800 rounded-lg p-4 mb-3 shadow-lg">
  <div class="flex justify-between items-start mb-2">
    <p class="text-white flex-grow">{task.description}</p>
  </div>
  <div class="flex gap-2 mt-2">
    <span class={`${difficultyColors[task.difficulty_level as DifficultyLevel]} text-xs px-2 py-1 rounded`}>
      {task.difficulty_level}
    </span>
    <span class="bg-blue-700 text-xs px-2 py-1 rounded">
      ⏱️ {task.estimated_time}
    </span>
  </div>
</div> 