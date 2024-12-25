import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	console.log('🔍 Loading page...');
	if (!event.locals.user) {
		console.log('🔍 User not found, redirecting to login...');
		redirect(302, '/demo/lucia/login');
	}
	console.log('🔍 User found, returning user data...', event.locals.user);
	return { user: event.locals.user };
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/demo/lucia/login');
	}
};
