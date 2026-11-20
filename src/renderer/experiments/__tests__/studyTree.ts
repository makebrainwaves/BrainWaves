/** A lab.js study node, as far as these tests read it. */
export type StudyNode = {
  title?: string;
  content?: unknown;
  /** A canvas.Frame's surrounding HTML. */
  context?: unknown;
  responses?: Record<string, string>;
  hooks?: Record<string, unknown>;
  template?: unknown;
  templateParameters?: Array<Record<string, unknown>>;
  sample?: { n?: string };
};

/** Every non-Space, non-skip key any screen in the study responds to. */
export const acceptedKeys = (
  node: unknown,
  out = new Set<string>()
): Set<string> => {
  if (Array.isArray(node)) node.forEach((child) => acceptedKeys(child, out));
  else if (node && typeof node === 'object') {
    for (const key of Object.keys((node as StudyNode).responses ?? {})) {
      const match = /^key(?:press|down)\((.+)\)$/.exec(key);
      if (match && match[1] !== 'Space' && match[1] !== 'q')
        out.add(match[1].toLowerCase());
    }
    Object.values(node).forEach((child) => acceptedKeys(child, out));
  }
  return out;
};

/** The first node with this title that satisfies `accept`. */
export const findNode = (
  node: unknown,
  title: string,
  accept: (candidate: StudyNode) => boolean
): StudyNode | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNode(child, title, accept);
      if (found) return found;
    }
  } else if (node && typeof node === 'object') {
    if ((node as StudyNode).title === title && accept(node as StudyNode))
      return node as StudyNode;
    for (const child of Object.values(node)) {
      const found = findNode(child, title, accept);
      if (found) return found;
    }
  }
  return undefined;
};

/** Parameter rows a loop really runs: built by its `before:prepare` hook, or literal. */
export const loopRows = (
  study: unknown,
  title: string,
  parameters: object = {}
) => {
  const loop = findNode(study, title, (node) => 'template' in node);
  const self = {
    parameters,
    options: { templateParameters: loop?.templateParameters ?? [] },
  };
  (
    loop?.hooks?.['before:prepare'] as ((this: typeof self) => void) | undefined
  )?.call(self);
  return { rows: self.options.templateParameters, n: Number(loop?.sample?.n) };
};

/** Trials a loop runs: `sample.n` when set, otherwise one per parameter row. */
export const loopCount = (
  study: unknown,
  title: string,
  parameters?: object
) => {
  const { rows, n } = loopRows(study, title, parameters);
  return n || rows.length;
};
