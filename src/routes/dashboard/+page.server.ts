import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFormattedActionPlan } from '$lib/server/db/queries';

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) {
    redirect(302, '/demo/lucia/login');
  }
  
  const actionPlan = await getFormattedActionPlan(event.locals.user.id);
  
  return { 
    user: event.locals.user,
    actionPlan
  };
}; 