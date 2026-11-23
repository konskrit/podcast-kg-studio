import { z } from "zod";

import {
  jobProgressEventSchema,
  jobStatusSchema,
  sourceStatusSchema,
} from "@/libs/schemas/job";

export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobProgressEvent = z.infer<typeof jobProgressEventSchema>;
