<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<h1>Login/Register</h1>
<form method="post" action="?/login" use:enhance>
	<label>
		Username
		<input name="username" />
	</label>
	<label>
		Password
		<input type="password" name="password" />
	</label>
	<button>Login</button>
	<button formaction="?/register">Register</button>
</form>

<div class="mt-4">
	<a 
		href="/demo/lucia/login/google"
		class="flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 border border-gray-300"
	>
		<img src="https://www.google.com/favicon.ico" alt="Google" class="w-4 h-4" />
		Login with Google
	</a>
</div>

<p style="color: red">{form?.message ?? ''}</p>
