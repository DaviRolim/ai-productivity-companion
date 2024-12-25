<script lang="ts">
  import { _ } from 'svelte-i18n';
  let { 
    isChatMinimized,
    messages,
    onSubmit,
    onToggle 
  } = $props<{
    isChatMinimized: boolean;
    messages: { role: string; content: any }[];
    onSubmit: (userInput: string) => Promise<void>;
    onToggle: () => void;
  }>();

  let userInput = $state('');


  // Handle form submission
  function handleSubmit(event: Event) {
    event.preventDefault();
    // Update parent's userInput
    onSubmit(userInput);
    // Clear local input after submission
    userInput = '';
  }
</script>

<div class={`fixed bottom-0 right-8 w-[300px] bg-slate-800 rounded-t-2xl shadow-lg transition-transform duration-300 ${isChatMinimized ? 'translate-y-[calc(100%-40px)]' : ''}`}>
  <button 
    class="w-full py-2 bg-slate-700 text-white cursor-pointer rounded-t-2xl hover:bg-slate-600 transition-colors"
    onclick={onToggle}
  >
    {isChatMinimized ? '💬' : '▼'}
  </button>
  
  <div class="p-4">
    <div class="mb-4 h-[300px] overflow-y-auto flex flex-col gap-3">
      {#each messages as message}
        <div class={`max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          <div class={`p-2 rounded-lg ${
            message.role === 'user' 
              ? 'bg-purple-500 text-white rounded-br-none' 
              : 'bg-slate-700 text-white rounded-bl-none'
          }`}>
            {message.role === 'user' 
              ? message.content 
              : typeof message.content === 'string' 
                ? message.content 
                : $_('chat.planUpdated')}
          </div>
        </div>
      {/each}
    </div>

    <form 
      onsubmit={handleSubmit} 
      class="flex gap-2"
    >
      <input
        type="text"
        bind:value={userInput}
        placeholder={$_('chat.placeholder')}
        aria-label={$_('chat.placeholder')}
        class="flex-1 p-2 border border-slate-600 rounded-lg bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      <button 
        type="submit"
        class="px-4 py-2 bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors"
      >
        {$_('chat.send')}
      </button>
    </form>
  </div>
</div> 