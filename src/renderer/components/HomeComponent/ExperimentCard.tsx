import React, { ReactElement } from 'react';
import { Card } from '../ui/card';

interface ExperimentCardProps {
  icon: string; // image imported via Vite — resolves to a URL string
  title: string;
  description: string;
  onClick: () => void;
}

export function ExperimentCard({
  onClick,
  icon,
  title,
  description,
}: ExperimentCardProps): ReactElement {
  return (
    <Card
      className="border-4 border-transparent hover:border-brand cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex p-4 gap-4">
        <div className="w-1/4 flex items-center">
          <img src={icon} alt={title} />
        </div>
        <div className="w-3/4 py-6">
          <h1 className="text-[24px] tracking-[0.86px] leading-[29px] text-[#1a1a1a] font-normal mb-2">
            {title}
          </h1>
          <p className="text-[16px] tracking-[0.57px] leading-[24px] text-[#4a4a4a]">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}
