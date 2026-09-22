import type { UserRole } from "@/types/database";

export interface CurrentProfile {
  id: string;
  email: string | null;
  fullName: string;
  role: UserRole;
  groupName: string | null;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "생산관리자",
  leader: "조장",
  worker: "작업자",
};

export function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}
