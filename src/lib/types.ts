import { z } from "zod";

export const sourceStatusSchema = z.enum([
  "uploaded",
  "extracting",
  "graph_ready",
  "failed",
]);

export const jobStatusSchema = z.enum([
  "queued",
  "running",
  "succeeded",
  "failed",
]);

export const jobProgressEventSchema = z.object({
  jobId: z.string(),
  stage: z.string().optional(),
  message: z.string().optional(),
  status: jobStatusSchema,
  progress: z.number().int().min(0).max(100).optional(),
});

export type JobProgressEvent = z.infer<typeof jobProgressEventSchema>;
