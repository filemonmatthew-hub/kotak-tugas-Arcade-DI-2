'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import ChallengeForm from '@/components/ChallengeForm';

function Guard({ role }: { role: 'dosen' | 'mahasiswa' }) {
  const router = useRouter();
  useEffect(() => {
    if (role !== 'dosen') router.replace('/tantangan');
  }, [role, router]);
  return role === 'dosen' ? <ChallengeForm /> : null;
}

export default function NewChallengePage() {
  return <Shell>{(role) => <Guard role={role} />}</Shell>;
}
