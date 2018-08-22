import { KERNEL_STATUS } from "../../constants/constants";

export const parseSingleQuoteJSON = (string: string) =>
  JSON.parse(string.replace(/'/g, '"'));

export const parseKernelStatus = (msg: Object) => {
  console.log(msg);
  switch (msg["content"]["execution_state"]) {
    case "busy":
      return KERNEL_STATUS.BUSY;
    case "idle":
      return KERNEL_STATUS.IDLE;
    case "starting":
    default:
      return KERNEL_STATUS.STARTING;
  }
};
