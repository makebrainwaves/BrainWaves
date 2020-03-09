import { KERNEL_STATUS } from '../../constants/constants';

export const parseSingleQuoteJSON = (string: string) => JSON.parse(string.replace(/'/g, '"'));

export const parseKernelStatus = (msg: Object) => {
  switch (msg['content']['execution_state']) {
    case 'busy':
      return KERNEL_STATUS.BUSY;
    case 'idle':
      return KERNEL_STATUS.IDLE;
    case 'starting':
    default:
      return KERNEL_STATUS.STARTING;
  }
};

export const debugParseMessage = (msg: Object) => {
  let content = '';
  switch (msg.channel) {
    case 'iopub':
      if (msg.content.execution_state) {
        content = JSON.stringify(msg.content);
      }
      if (msg.content.code) {
        content = msg.content.code.slice(0, 300).concat('...');
      }
      if (msg.content.text) {
        content = msg.content.text;
      }
      if (msg.content.data) {
        content = Object.keys(msg.content.data);
      }
      break;
    case 'shell':
      content = JSON.stringify(msg.content);
      break;

    default:
      content = JSON.stringify(msg);
  }
  return `${msg.channel} ${content}`;
};
