export function debug(message, object) {
  if (XF.config.debug) {
    console.log(`[${message}]:`, object);
  }
}

export default { debug };