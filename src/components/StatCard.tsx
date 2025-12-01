interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  textClass?: string;
}

export const StatCard = ({ title, value, icon, color, textClass }: StatCardProps) => (
  <div className={`p-6 ${color} text-white rounded-xl shadow-lg flex items-center`}>
    <div className={`p-3 text-3xl bg-white ${textClass ? '' : 'bg-opacity-30'} rounded-full mr-4`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${textClass ? 'text-gray-600' : 'opacity-80'}`}>{title}</p>
      <p className={`text-2xl font-bold ${textClass || ''}`}>{value}</p>
    </div>
  </div>
);
