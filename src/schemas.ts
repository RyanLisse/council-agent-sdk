export type CouncilMemberId = 'alpha' | 'bravo' | 'charlie' | 'delta';

export type CouncilMemberOutput = {
  id: CouncilMemberId;
  answer: string;
};

export type JudgeResult = {
  answer: string;
  agreement: Record<CouncilMemberId, number>;
  notes: string;
};

export const MEMBER_IDS: CouncilMemberId[] = ['alpha', 'bravo', 'charlie', 'delta'];
