export const getFormattedCategoryName = (name) => {
  if (!name) return '';
  const key = name.trim().toUpperCase();
  switch (key) {
    case 'RCC':
      return 'RCC';
    case 'RCC + FIN':
    case 'RCC + FINISHES':
      return 'RCC + FIN';
    case 'PAINT NOC':
    case 'PAINT NOC + TEXTURE':
      return 'Paint NOC + Texture';
    case 'CHECKLIST A':
      return 'Checklist A';
    case 'DEVELOPMENT':
      return 'Development';
    default:
      return name;
  }
};

export const getCategoryOrder = (name) => {
  if (!name) return 999;
  const key = name.trim().toUpperCase();
  switch (key) {
    case 'RCC':
      return 1;
    case 'RCC + FIN':
    case 'RCC + FINISHES':
      return 2;
    case 'PAINT NOC':
    case 'PAINT NOC + TEXTURE':
      return 3;
    case 'CHECKLIST A':
      return 4;
    case 'DEVELOPMENT':
      return 5;
    default:
      return 999;
  }
};

export const sortCategories = (categories) => {
  if (!categories || !Array.isArray(categories)) return [];
  return [...categories].sort((a, b) => {
    const orderA = getCategoryOrder(a.name);
    const orderB = getCategoryOrder(b.name);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });
};
