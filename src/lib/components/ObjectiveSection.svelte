<script lang="ts">
  import type { ObjectiveSchema, TaskSchema } from '$lib/schemas';
  import type { z } from 'zod';
  import GoalCard from './GoalCard.svelte';
  import TaskCard from './TaskCard.svelte';
  import { _ } from 'svelte-i18n';
  
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
</script>

<div class="mb-12">
  <h2 class="text-2xl text-purple-400 mb-6">{objective.name}</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <GoalCard
      title={$_('goals.shortTerm')}
      goals={objective.short_term}
      type="short"
      onGetTasks={(goal) => onGetTasks(objective.name, goal)}
      {loadingTasks}
      objectiveName={objective.name}
    />

    <GoalCard
      title={$_('goals.mediumTerm')}
      goals={objective.medium_term}
      type="medium"
    />

    <GoalCard
      title={$_('goals.longTerm')}
      goals={objective.long_term}
      type="long"
    />
  </div>
</div> 