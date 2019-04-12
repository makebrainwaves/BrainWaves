// -------------------------------------------------------------------------
// Action Types

export const SEND_EXECUTE_REQUEST = "SEND_EXECUTE_REQUEST";
export const LOAD_EPOCHS = "LOAD_EPOCHS";
export const LOAD_CLEANED_EPOCHS = "LOAD_CLEANED_EPOCHS";
export const LOAD_PSD = "LOAD_PSD";
export const LOAD_ERP = "LOAD_ERP";
export const LOAD_TOPO = "LOAD_TOPO";
export const CLEAN_EPOCHS = "CLEAN_EPOCHS";

// -------------------------------------------------------------------------
// Actions

export const sendExecuteRequest = (payload: string) => ({
  payload,
  type: SEND_EXECUTE_REQUEST,
});

export const loadEpochs = (payload: Array<string>) => ({
  payload,
  type: LOAD_EPOCHS,
});

export const loadCleanedEpochs = (payload: Array<string>) => ({
  payload,
  type: LOAD_CLEANED_EPOCHS,
});

export const loadPSD = () => ({
  type: LOAD_PSD,
});

export const loadERP = (payload: ?string) => ({
  payload,
  type: LOAD_ERP,
});

export const loadTopo = () => ({
  type: LOAD_TOPO,
});

export const cleanEpochs = () => ({ type: CLEAN_EPOCHS });
