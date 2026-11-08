import React from 'react';

interface KPIProps {
  label: string;
  value: string;
  sub: string;
  icon: any;
  trend?: string;
}

export default function KPI({ label, value, sub, icon: Icon, trend }: KPIProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span>{label}</span>
        <div className="kpi-icon">
          <Icon size={18} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span>{sub}</span>
        {trend && <b>{trend}</b>}
      </div>
    </div>
  );
}