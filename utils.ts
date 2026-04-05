export const calculateAge = (birthDateString: string): string => {
  if (!birthDateString) return '未知年齡 Unknown Age';
  
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  // If days is negative, borrow from the previous month
  if (days < 0) {
    months--;
    // Get the number of days in the previous month
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += previousMonth.getDate();
  }

  // If months is negative, borrow from the previous year
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return '尚未出生 Not born yet';
  
  // Construct the string based on non-zero values
  const parts = [];
  
  if (years > 0) parts.push(`${years} 歲 yrs`);
  if (months > 0) parts.push(`${months} 個月 mos`);
  if (days > 0) parts.push(`${days} 天 days`);

  if (parts.length === 0) return '今天 Today'; // Born today
  
  return parts.join(' ');
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatMonthYear = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const en = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const zh = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  return `${zh} ${en}`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};