import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { locale } from 'svelte-i18n';
import '$lib/i18n'; // Import to initialize i18n

const handle: Handle = async ({ event, resolve }) => {
	// Handle i18n
	const lang = event.request.headers.get('accept-language')?.split(',')[0];
	if (lang) {
		locale.set(lang);
	}

	// Handle auth
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

export { handle };
