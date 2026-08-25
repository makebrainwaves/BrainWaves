import React, { useEffect, useState } from 'react';
import { EXPERIMENTS } from '../constants/constants';
import {
  ExperimentObject,
  ExperimentParameters,
  ImportedExperiment,
} from '../constants/interfaces';
import { readImportedExperimentFile } from '../utils/filesystem/storage';
import { LabjsExperimentWindow } from './LabjsExperimentWindow';
import { ImportedExperimentWindow } from './ImportedExperimentWindow';

/**
 * The contract every experiment runtime honours. Collect and Preview render the
 * dispatcher and never learn which runtime ran, so Preview comes free: same
 * component, fullScreen=false, no-op marker callback.
 */
export interface ExperimentRuntimeProps {
  title: string;
  fullScreen?: boolean;
  eventCallback: (code: number, time: number) => void;
  onFinish: (csv: string) => void;
}

type Props = ExperimentRuntimeProps & {
  type: EXPERIMENTS;
  experimentObject: ExperimentObject;
  params: ExperimentParameters;
};

/** What an imported file resolved to. A half-resolved study is unrepresentable. */
type ResolvedImport =
  | { kind: 'jspsych'; source: string }
  | { kind: 'labjs'; study: ExperimentObject };

const resolveImport = async (
  title: string,
  imported: ImportedExperiment
): Promise<ResolvedImport> => {
  const source = await readImportedExperimentFile(title, imported.file);
  if (imported.kind === 'jspsych') return { kind: 'jspsych', source };
  return { kind: 'labjs', study: JSON.parse(source) as ExperimentObject };
};

export const ExperimentRuntime: React.FC<Props> = ({
  type,
  experimentObject,
  params,
  ...runtime
}) => {
  const imported = type === EXPERIMENTS.IMPORTED ? params.imported : undefined;
  const [resolved, setResolved] = useState<ResolvedImport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imported?.file) return undefined;
    let cancelled = false;
    setResolved(null);
    setError(null);
    resolveImport(runtime.title, imported)
      .then((value) => {
        if (!cancelled) setResolved(value);
      })
      .catch((failure: Error) => {
        if (!cancelled) setError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [imported, runtime.title]);

  if (imported) {
    if (error) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center h-full p-4 text-center"
        >
          <div>
            <h2>This experiment could not be opened</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      );
    }
    if (!resolved) {
      return (
        <div className="flex items-center justify-center h-full">
          <p>Loading the imported experiment…</p>
        </div>
      );
    }
    if (resolved.kind === 'labjs') {
      return (
        <LabjsExperimentWindow
          {...runtime}
          experimentObject={resolved.study}
          params={params}
        />
      );
    }
    return (
      <ImportedExperimentWindow
        {...runtime}
        source={resolved.source}
        imported={imported}
      />
    );
  }

  return (
    <LabjsExperimentWindow
      {...runtime}
      experimentObject={experimentObject}
      params={params}
    />
  );
};
