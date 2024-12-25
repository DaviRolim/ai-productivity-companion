import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFormattedActionPlan } from '$lib/server/db/queries';

export const load: PageServerLoad = async (event) => {
	console.log('🔍 Loading page...');
	if (!event.locals.user) {
		console.log('🔍 User not found, redirecting to login...');
		redirect(302, '/demo/lucia/login');
	}
	
	console.log('🔍 Fetching action plan for user:', event.locals.user.id);
	const actionPlan = await getFormattedActionPlan(event.locals.user.id);
	
	return { 
		user: event.locals.user,
		actionPlan
	};
};

// export const actions: Actions = {
// 	logout: async (event) => {
// 		if (!event.locals.session) {
// 			return fail(401);
// 		}
// 		await auth.invalidateSession(event.locals.session.id);
// 		auth.deleteSessionTokenCookie(event);

// 		return redirect(302, '/demo/lucia/login');
// 	}
// };
