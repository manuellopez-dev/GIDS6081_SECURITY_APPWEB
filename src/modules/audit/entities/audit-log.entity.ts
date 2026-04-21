export class AuditLog {
  id!: number;
  userId!: number | null;
  username!: string;
  action!: string;
  detail!: string;
  severity!: string;
  createdAt!: Date;
}