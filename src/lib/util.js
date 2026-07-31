export function moveItem(arr, i, dir) {
  const next = arr.slice();
  const j = i + dir;
  if (j < 0 || j >= next.length) return arr;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function newRecipeId() {
  return 'recipe-' + Date.now();
}

export function emptyRecipe(id, title, categoryLabel) {
  return {
    id,
    categoryLabel,
    title,
    author: '',
    meta: [
      { label: 'Porzioni', value: '2', isCat: false },
      { label: 'Preparazione', value: '', isCat: false },
      { label: 'Categoria', value: categoryLabel, isCat: true },
    ],
    ingredients: [{ name: '', qty: '', note: '', tags: [], group: '' }],
    procedure: '',
    enjoy: '💙💜',
    glossary: [],
    tips: [],
  };
}

export function getCatOrder(data) {
  const order = (data.catOrder || []).slice();
  const existing = new Set(data.recipes.map((r) => r.categoryLabel));
  existing.forEach((c) => {
    if (!order.includes(c)) order.push(c);
  });
  return order.filter((c) => existing.has(c));
}
