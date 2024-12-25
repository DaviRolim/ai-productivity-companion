import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies }) => {
	// Generate state for CSRF protection
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, { path: '/', maxAge: 60 * 10 }); // 10 minutes

	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: GOOGLE_REDIRECT_URI,
		response_type: 'code',
		scope: 'email profile',
		state,
		prompt: 'select_account'
	});

	throw redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};