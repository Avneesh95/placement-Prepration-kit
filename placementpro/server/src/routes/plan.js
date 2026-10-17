const router = require('express').Router();
const { z } = require('zod');
const { StudyPlan } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { generatePlan, rescheduleMissed, weeklySummary, todayStr } = require('../services/planner');
router.use(requireAuth);

const view = (plan) => {
  const today = todayStr(); const tasks = plan.tasks;
  return {
    plan: { durationDays: plan.durationDays, startDate: plan.startDate, dailyHours: plan.dailyHours, targetCompanies: plan.targetCompanies, language: plan.language, proficiency: plan.proficiency, examDate: plan.examDate, tasks },
    today: tasks.filter((t) => t.date === today),
    overdue: tasks.filter((t) => !t.done && t.date < today).length,
    completion: tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0,
    weeks: weeklySummary(plan),
  };
};
router.get('/', asyncHandler(async (req, res) => {
  const plan = await StudyPlan.findOne({ user: req.user._id });
  res.json(plan ? view(plan) : { plan: null });
}));
router.post('/', asyncHandler(async (req, res) => {
  const b = z.object({ durationDays: z.union([z.literal(30), z.literal(60), z.literal(90)]), dailyHours: z.coerce.number().min(0.5).max(16), targetCompanies: z.array(z.string()).max(10).default([]), proficiency: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'), language: z.enum(['java', 'c', 'cpp', 'python']).default('java'), examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).parse(req.body);
  const { tasks, startDate } = await generatePlan(req.user, b);
  const plan = await StudyPlan.findOneAndUpdate({ user: req.user._id }, { $set: { user: req.user._id, durationDays: b.durationDays, startDate, dailyHours: b.dailyHours, targetCompanies: b.targetCompanies, language: b.language, proficiency: b.proficiency, examDate: b.examDate, tasks } }, { upsert: true, new: true });
  res.status(201).json(view(plan));
}));
router.patch('/tasks/:taskId', asyncHandler(async (req, res) => {
  const { done } = z.object({ done: z.boolean() }).parse(req.body);
  const plan = await StudyPlan.findOne({ user: req.user._id });
  const t = plan && plan.tasks.id(req.params.taskId);
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Task not found.');
  t.done = done; t.doneAt = done ? new Date() : undefined; await plan.save();
  res.json(view(plan));
}));
router.post('/reschedule', asyncHandler(async (req, res) => {
  const plan = await StudyPlan.findOne({ user: req.user._id });
  if (!plan) throw new ApiError(404, 'NOT_FOUND', 'Create a plan first.');
  const moved = rescheduleMissed(plan); await plan.save();
  res.json({ moved, ...view(plan) });
}));
module.exports = router;
