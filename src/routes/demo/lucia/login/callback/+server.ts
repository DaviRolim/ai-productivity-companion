import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '$env/static/private';

interface GoogleUser {
	email: string;
	name: string;
	picture: string;
}

export const GET: RequestHandler = async (event) => {
	console.log('🔵 OAuth callback started');
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('oauth_state');
	
	console.log('🔍 OAuth params:', { 
		hasCode: !!code, 
		hasState: !!state, 
		hasStoredState: !!storedState,
		stateMatch: state === storedState 
	});

	if (!code || !state || !storedState || state !== storedState) {
		console.error('❌ OAuth validation failed:', { code, state, storedState });
		throw error(400, 'Invalid request');
	}

	try {
		console.log('🔄 Exchanging code for tokens...');
		const tokens = await getGoogleTokens(code);
		console.log('✅ Got tokens:', { hasAccessToken: !!tokens.access_token });

		console.log('🔄 Fetching user data...');
		const userData = await getGoogleUser(tokens.access_token);
		console.log('✅ Got user data:', { email: userData.email });

		console.log('🔄 Finding or creating user...');
		let user = await findUserByEmail(userData.email);
		if (!user) {
			console.log('➕ Creating new user...');
			user = await createUser(userData);
		}
		console.log('✅ User ready:', { userId: user.id });

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		console.log('✅ Session created and cookie set');

		console.log('🎉 OAuth flow completed successfully');
	} catch (e) {
		console.error('❌ OAuth error:', e);
	}
		redirect(302, '/demo/lucia');
};

async function getGoogleTokens(code: string) {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: GOOGLE_REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});

	if (!response.ok) {
		throw error(400, 'Failed to get tokens');
	}

	return response.json();
}

async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
	const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!response.ok) {
		throw error(400, 'Failed to get user info');
	}

	return response.json();
}

async function findUserByEmail(email: string) {
	console.log('🔍 Finding user by email:', email);
	const [user] = await db
		.select()
		.from(table.user)
		.where(eq(table.user.username, email));
	return user;
}

async function createUser(userData: GoogleUser) {
	console.log('🔄 Creating user:', userData.email);
	const user = {
		id: crypto.randomUUID(),
		username: userData.email,
		age: null,
		passwordHash: ''
	};

	await db.insert(table.user).values(user);
	return user;
}