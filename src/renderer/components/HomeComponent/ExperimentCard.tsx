import React, { ReactElement } from 'react';
import styles from '../styles/common.module.css';

interface ExperimentCardProps {
  icon: any;
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
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className={styles.experimentCard} onClick={onClick}>
        <div className="flex">
          <div className={[styles.experimentCardImage, 'w-1/4'].join(' ')}>
            <img src={icon} alt={title} />
          </div>
          <div className={[styles.descriptionContainer, 'w-3/4'].join(' ')}>
            <h1 className={styles.experimentCardHeader}>{title}</h1>
            <div className={styles.experimentCardDescription}>
              <p>{description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
