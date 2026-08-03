export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const money = (cents) => Number((cents / 100).toFixed(2));

export function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  return `HK-${stamp}-${rand}`;
}
