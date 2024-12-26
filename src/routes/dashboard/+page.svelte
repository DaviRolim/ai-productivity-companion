<script lang="ts">
  import type { ActionPlanSchema } from '$lib/schemas';
  import type { z } from 'zod';
  import type { PageData } from './$types';

  type ActionPlan = z.infer<typeof ActionPlanSchema>;
  const { data } = $props<{ data: PageData }>();
  let currentPlan = $state<ActionPlan | null>(data.actionPlan);
</script>

<section>
  <h1 class="text-4xl font-bold text-white mb-8">Dashboard</h1>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Summary Cards -->
    <div class="bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 class="text-xl font-semibold text-purple-400 mb-4">Active Goals</h3>
      <div class="text-3xl text-white">
        {currentPlan?.objectives?.reduce((acc, obj) => 
          acc + obj.short_term.length + obj.medium_term.length + obj.long_term.length, 0) || 0}
      </div>
    </div>
    
    <div class="bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 class="text-xl font-semibold text-purple-400 mb-4">Pending Tasks</h3>
      <div class="text-3xl text-white">
        {currentPlan?.objectives?.reduce((acc, obj) => 
          acc + obj.short_term.reduce((tasks, goal) => tasks + goal.tasks.length, 0), 0) || 0}
      </div>
    </div>
    
    <div class="bg-slate-800 rounded-xl p-6 shadow-lg">
      <h3 class="text-xl font-semibold text-purple-400 mb-4">Completed Tasks</h3>
      <div class="text-3xl text-white">0</div>
    </div>
  </div>
</section> 