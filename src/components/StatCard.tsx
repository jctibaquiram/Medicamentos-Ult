import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color?: string;
  textClass?: string;
}

export const StatCard = ({ title, value, icon, color = 'bg-neutral-900 border-neutral-800' }: StatCardProps) => {
  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-neutral-400 font-medium">{title}</span>
      </div>
      <p className="text-xl font-semibold text-neutral-100 tabular-nums">{value}</p>
    </div>
  );
};
