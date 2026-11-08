import React from 'react';

interface PageHeadProps {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export default function PageHead({ eyebrow, title, desc, action }: PageHeadProps) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow dark">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </div>
  );
}