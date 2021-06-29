export const parseSingleQuoteJSON = (string: string) =>
  JSON.parse(string.replace(/'/g, '"'));

export const debugParseMessage = (msg: Record<string, any>) => {
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
        content = JSON.stringify(Object.keys(msg.content.data));
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
