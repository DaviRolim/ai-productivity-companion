import { db } from '../index';
import { eq } from 'drizzle-orm';
import { user } from '../schema';

export async function findUserByEmail(email: string) {
  console.log('📊 [DB] Finding user by email:', email);
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.username, email));
    return foundUser;
  } catch (error) {
    console.error('❌ [DB] Error finding user:', error);
    throw error;
  }
}

export async function createUser(userData: { email: string }) {
  console.log('📊 [DB] Creating new user:', userData.email);
  try {
    const [newUser] = await db.insert(user).values({
      id: crypto.randomUUID(),
      username: userData.email,
      age: null,
      passwordHash: ''
    }).returning();
    return newUser;
  } catch (error) {
    console.error('❌ [DB] Error creating user:', error);
    throw error;
  }
} 