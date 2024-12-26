import type { ActionPlanSchema, TaskSchema } from '$lib/schemas';
import type { z } from 'zod';

type ActionPlan = z.infer<typeof ActionPlanSchema>;
type Task = z.infer<typeof TaskSchema>;

interface DbTask {
  id: string;
  description: string;
  difficultyLevel: string;
  estimatedTime: string;
  completed: boolean;
  goalId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DbGoal {
  id: string;
  action: string;
  timeframe: string;
  objectiveId: string;
  tasks?: DbTask[];
  createdAt: Date;
  updatedAt: Date;
}

interface DbObjective {
  id: string;
  name: string;
  goals: DbGoal[];
  actionPlanId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DbPlan {
  id: string;
  userId: string;
  objectives: DbObjective[];
  createdAt: Date;
  updatedAt: Date;
}

export function transformToFrontendFormat(dbPlan: DbPlan): ActionPlan | null {
  console.log('🔄 Starting to transform data to frontend format');
  try {
    if (!dbPlan) {
      console.log('🔄 No plan to transform');
      return null;
    }

    const transformed = {
      objectives: dbPlan.objectives.map(obj => ({
        name: obj.name,
        short_term: (obj.goals || [])
          .filter(g => g.timeframe === 'short_term')
          .map(g => ({ 
            id: g.id,
            action: g.action,
            tasks: (g.tasks || []).map(t => ({
              description: t.description,
              difficulty_level: t.difficultyLevel as "Easy" | "Medium" | "Hard",
              estimated_time: t.estimatedTime
            }))
          })),
        medium_term: (obj.goals || [])
          .filter(g => g.timeframe === 'medium_term')
          .map(g => ({ id: g.id, action: g.action, tasks: [] })),
        long_term: (obj.goals || [])
          .filter(g => g.timeframe === 'long_term')
          .map(g => ({ id: g.id, action: g.action, tasks: [] }))
      }))
    };

    console.log('🔄 Successfully transformed data');
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming data:', error);
    return null;
  }
}

export function updatePlanWithTasks(
  currentPlan: ActionPlan,
  objective: string,
  goal: string,
  tasks: { objective: { tasks: Task[] } }
): ActionPlan {
  return {
    objectives: currentPlan.objectives.map(obj => {
      if (obj.name !== objective) return obj;
      return {
        ...obj,
        short_term: obj.short_term.map(g => {
          if (g.action !== goal) return g;
          return {
            ...g,
            tasks: tasks.objective.tasks
          };
        })
      };
    })
  };
} 