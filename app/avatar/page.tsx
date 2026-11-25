'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import AvatarEditor from '@/components/AvatarEditor';

function Guard({ role }: { role: 'dosen' | 'mahasiswa' }) {
  const router = useRouter();
  useEffect(() => {
    if (role === 'dosen') router.replace('/dashboard');
  }, [role, router]);
  return role === 'dosen' ? null : <AvatarEditor />;
}

export default function AvatarPage() {
  return <Shell>{(role) => <Guard role={role} />}</Shell>;
}
