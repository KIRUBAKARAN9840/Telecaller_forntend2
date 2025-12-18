'use client';

import TelecallerList from '@/app/portal/components/manager/TelecallerList';

export default function TelecallersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Team Management</h1>
        <p className="text-gray-400 mt-2">Manage your telecaller team and track their performance</p>
      </div>

      <TelecallerList />
    </div>
  );
}