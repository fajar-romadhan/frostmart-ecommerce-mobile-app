export const formatRupiah = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return 'Rp ' + val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[0-9]{9,15}$/;
  return re.test(phone);
};
