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
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className={`grid grid-cols-12 gap-4 ${styles.experimentCard}`} onClick={onClick}>
        <div className={`col-span-4 ${styles.experimentCardImage}`}>
          <img src={icon} />
        </div>
        <div className={`col-span-8 ${styles.descriptionContainer}`}>
          <h1 className={styles.experimentCardHeader}>{title}</h1>
          <div className={styles.experimentCardDescription}>
            <p>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
