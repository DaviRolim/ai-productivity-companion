<script lang="ts">
  import type { ActionPlanSchema, ActionableTasksSchema, TaskSchema } from '$lib/schemas';
  import type { z } from 'zod';
  import type { PageData } from './$types';
  import ObjectiveSection from '$lib/components/ObjectiveSection.svelte';
  import ChatBox from '$lib/components/ChatBox.svelte';
  import { _ } from 'svelte-i18n';

  type ActionPlan = z.infer<typeof ActionPlanSchema>;
  
  const { data } = $props<{ data: PageData }>();

  let isChatMinimized = $state(false);
  let messages = $state<{ role: string; content: string | ActionPlan }[]>([]);
  let currentPlan = $state<ActionPlan | null>(data.actionPlan);
  let loadingTasks = $state<Record<string, boolean>>({});

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
            currentPlan = result.response;
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
        // Update the tasks in the current plan
        currentPlan = {
          objectives: currentPlan.objectives.map(obj => {
            if (obj.name !== objective) return obj;
            return {
              ...obj,
              short_term: obj.short_term.map(g => {
                if (g.action !== goal) return g;
                return {
                  ...g,
                  tasks: result.tasks.objective.tasks
                };
              })
            };
          })
        };
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

<main class="max-w-7xl mx-auto p-8">
  <section>
    <h1 class="text-4xl text-white mb-8">{$_('goals.title')}</h1>
    
    {#if currentPlan?.objectives}
      {#each currentPlan.objectives as objective}
        <ObjectiveSection
          {objective}
          {loadingTasks}
          onGetTasks={getTasksForGoal}
        />
      {/each}
    {:else}
      <ObjectiveSection
        objective={{
          name: $_('goals.noObjectives'),
          short_term: [],
          medium_term: [],
          long_term: []
        }}
        {loadingTasks}
        onGetTasks={getTasksForGoal}
      />
    {/if}
  </section>

  <ChatBox
    {isChatMinimized}
    {messages}
    onSubmit={handleSubmit}
    onToggle={toggleChat}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background-color: #1a1b2e;
    color: #e2e2f5;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>
