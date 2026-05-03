export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return 'EGP 0.00';
  
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};
