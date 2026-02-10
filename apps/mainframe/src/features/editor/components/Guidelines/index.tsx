import React from 'react';
import type { GuideLine } from '@/utils/snap';
import './index.scss';

interface GuidelinesProps {
  guidelines: GuideLine[];
  canvasWidth: number;
  canvasHeight: number;
}

const Guidelines: React.FC<GuidelinesProps> = ({ guidelines, canvasWidth, canvasHeight }) => {
  if (guidelines.length === 0) return null;

  return (
    <svg className="guidelines-overlay" width={canvasWidth} height={canvasHeight}>
      {guidelines.map((line, i) =>
        line.type === 'vertical' ? (
          <line
            key={`v-${i}`}
            x1={line.position}
            y1={0}
            x2={line.position}
            y2={canvasHeight}
            className="guideline guideline-vertical"
          />
        ) : (
          <line
            key={`h-${i}`}
            x1={0}
            y1={line.position}
            x2={canvasWidth}
            y2={line.position}
            className="guideline guideline-horizontal"
          />
        )
      )}
    </svg>
  );
};

export default Guidelines;
