import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  difficulty_level: z.enum(["Easy", "Medium", "Hard"]),
  estimated_time: z.string(),
  completed: z.boolean().default(false)
});

export const GoalSchema = z.object({
  id: z.string(),
  action: z.string().describe("A specific action or goal to achieve"),
  tasks: z.array(TaskSchema).default([])
});

export const ObjectiveSchema = z.object({
  name: z.string().describe("The name/title of the objective"),
  short_term: z.array(GoalSchema).describe("Short-term actions (0-6 months)"),
  medium_term: z.array(GoalSchema).describe("Medium-term actions (6 months to 2 years)"),
  long_term: z.array(GoalSchema).describe("Long-term actions (2-5 years)"),
});

export const ActionPlanSchema = z.object({
  objectives: z.array(ObjectiveSchema).describe("List of objectives with their respective goals"),
});

export const ActionableTasksSchema = z.object({
  objective: z.object({
    name: z.string(),
    tasks: z.array(TaskSchema)
  })
}); 