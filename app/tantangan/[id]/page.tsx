'use client';

import { useParams } from 'next/navigation';
import Shell from '@/components/Shell';
import ChallengeRoom from '@/components/ChallengeRoom';

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  return <Shell>{(role) => <ChallengeRoom id={id} role={role} />}</Shell>;
}
