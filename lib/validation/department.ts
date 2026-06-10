import { z } from "zod";
import { DEPARTMENTS } from "@/lib/data/departments";

export const departmentSchema = z.object({
  department: z.enum(DEPARTMENTS as [string, ...string[]], {
    message: "invalidDepartment",
  }),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
