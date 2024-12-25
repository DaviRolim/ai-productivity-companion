import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const actionPlan = sqliteTable('action_plan', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const objective = sqliteTable('objective', {
	id: text('id').primaryKey(),
	actionPlanId: text('action_plan_id')
		.notNull()
		.references(() => actionPlan.id),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const goal = sqliteTable('goal', {
	id: text('id').primaryKey(),
	objectiveId: text('objective_id')
		.notNull()
		.references(() => objective.id),
	action: text('action').notNull(),
	timeframe: text('timeframe').notNull(), // 'short_term', 'medium_term', or 'long_term'
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const task = sqliteTable('task', {
	id: text('id').primaryKey(),
	goalId: text('goal_id')
		.notNull()
		.references(() => goal.id),
	description: text('description').notNull(),
	difficultyLevel: text('difficulty_level').notNull(), // 'Easy', 'Medium', or 'Hard'
	estimatedTime: text('estimated_time').notNull(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type ActionPlan = typeof actionPlan.$inferSelect;
export type Objective = typeof objective.$inferSelect;
export type Goal = typeof goal.$inferSelect;
export type Task = typeof task.$inferSelect;
