'use client';

import Shell from '@/components/Shell';
import ChallengeList from '@/components/ChallengeList';

export default function ChallengesPage() {
  return <Shell>{(role) => <ChallengeList role={role} />}</Shell>;
}
