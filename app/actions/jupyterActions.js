// -------------------------------------------------------------------------
// Action Types

export const LAUNCH_KERNEL = "LAUNCH_KERNEL";
export const REQUEST_KERNEL_INFO = "REQUEST_KERNEL_INFO";
export const SEND_EXECUTE_REQUEST = "SEND_EXECUTE_REQUEST";
export const CLOSE_KERNEL = "CLOSE_KERNEL";

// -------------------------------------------------------------------------
// Actions

export const launchKernel = () => ({ type: LAUNCH_KERNEL });

export const requestKernelInfo = () => ({ type: REQUEST_KERNEL_INFO });

export const sendExecuteRequest = (payload: string) => ({
  payload,
  type: SEND_EXECUTE_REQUEST
});

export const closeKernel = () => ({ type: CLOSE_KERNEL });
