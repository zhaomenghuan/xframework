export function isIE() {
  return "ActiveXObject" in window;
}

export function isEdge() {
  return !!window.navigator.userAgent.match(/Edge/);
}

export default { isIE };
