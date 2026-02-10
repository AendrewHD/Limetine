export const VALID_MILESTONE_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'flag'] as const;

export type MilestoneShape = typeof VALID_MILESTONE_SHAPES[number];

export function validateMilestoneShape(shape: string | null | undefined): MilestoneShape {
  if (!shape) return 'circle';
  if (VALID_MILESTONE_SHAPES.includes(shape as any)) {
    return shape as MilestoneShape;
  }
  return 'circle';
}
