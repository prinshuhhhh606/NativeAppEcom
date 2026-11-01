export const formatPrice = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '+91 98XXX XXXXX';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length >= 10) {
    return `+91 ${cleaned.slice(0, 2)}XXX X${cleaned.slice(-4)}`;
  }
  return phone;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateSecondsRemaining = (deadline) => {
  if (!deadline) return 0;
  const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
};

