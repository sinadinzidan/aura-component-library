/**
 * Work order vocabulary shared by the operations components: priorities, statuses and the pure
 * helpers that judge due dates and hours.
 */

export type WorkPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type WorkOrderStatus = 'open' | 'planned' | 'in-progress' | 'waiting' | 'done';
export type WorkOrderType = 'corrective' | 'preventive' | 'inspection' | 'modification';

export type OperationsWorkOrder = {
  id: string;
  title: string;
  type: WorkOrderType;
  priority: WorkPriority;
  status: WorkOrderStatus;
  /** Epoch milliseconds. */
  dueAt: number;
  estimatedHours: number;
  /** 0–100. */
  progress: number;
};

export type WorkOrderPerson = { id: string; name: string; initials?: string };

export const WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = ['open', 'planned', 'in-progress', 'waiting', 'done'];

const PRIORITY_MEANING: Record<WorkPriority, string> = { P1: 'Immediate', P2: 'Urgent', P3: 'Normal', P4: 'Low' };

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
};

const TYPE_LABEL: Record<WorkOrderType, string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

/** What a priority code stands for, for labels and tooltips. */
export const priorityMeaning = (priority: WorkPriority): string => PRIORITY_MEANING[priority];
export const workOrderStatusLabel = (status: WorkOrderStatus): string => STATUS_LABEL[status];
export const workOrderTypeLabel = (type: WorkOrderType): string => TYPE_LABEL[type];

/** Past its due date and not finished. */
export function isOverdue(order: Pick<OperationsWorkOrder, 'dueAt' | 'status'>, now: number): boolean {
  return order.status !== 'done' && order.dueAt < now;
}

/** P1 first; within a priority, the earliest due date first. Does not mutate the input. */
export function sortByPriority<T extends Pick<OperationsWorkOrder, 'priority' | 'dueAt'>>(orders: readonly T[]): T[] {
  return [...orders].sort((a, b) => a.priority.localeCompare(b.priority) || a.dueAt - b.dueAt);
}

/** How many orders there are in each status. Every status is present, zero included. */
export function countByStatus(orders: readonly Pick<OperationsWorkOrder, 'status'>[]): Record<WorkOrderStatus, number> {
  const counts: Record<WorkOrderStatus, number> = { open: 0, planned: 0, 'in-progress': 0, waiting: 0, done: 0 };
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

/** Hours expected to be spent by now, from the estimate and the progress. */
export function earnedHours(order: Pick<OperationsWorkOrder, 'estimatedHours' | 'progress'>): number {
  return (order.estimatedHours * Math.min(100, Math.max(0, order.progress))) / 100;
}
