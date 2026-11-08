import React from 'react';
import { FileImage } from 'lucide-react';

interface EmptyProps {
  text: string;
}

export default function Empty({ text }: EmptyProps) {
  return (
    <div className="empty">
      <div>
        <FileImage size={21} />
      </div>
      <span>{text}</span>
    </div>
  );
}