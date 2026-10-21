export const formatNumber = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-IN').format(val);
};

export const formatPercent = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(2)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

export const cleanColumnLabel = (col) => {
  if (!col) return '';
  return col
    .replace(/_/g, ' ')
    .replace(/\bpct\b/gi, '(%)')
    .replace(/\bval\b/gi, 'Value')
    .replace(/\bavg\b/gi, 'Average')
    .replace(/\bmax\b/gi, 'Max')
    .replace(/\bmin\b/gi, 'Min')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
