import { browser } from '$app/environment';
import '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
    if (browser) {
        console.log('Language: ', window.navigator.language);
        locale.set(window.navigator.language);
    }
    await waitLocale();
}; 