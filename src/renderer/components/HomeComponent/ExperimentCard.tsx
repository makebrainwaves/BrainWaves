import React, { ReactElement } from 'react';
import { Segment, Grid, Header, Image } from 'semantic-ui-react';
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
    <Segment>
      <Grid columns="two" className={styles.experimentCard} onClick={onClick}>
        <Grid.Row>
          <Grid.Column width={4} className={styles.experimentCardImage}>
            <Image src={icon} />
          </Grid.Column>
          <Grid.Column width={12} className={styles.descriptionContainer}>
            <Header as="h1" className={styles.experimentCardHeader}>
              {title}
            </Header>
            <div className={styles.experimentCardDescription}>
              <p>{description}</p>
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
  );
}
