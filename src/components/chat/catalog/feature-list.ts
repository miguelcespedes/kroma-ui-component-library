export function createFeatureList(features: string[]) {
  const list = document.createElement("ul");
  list.className = "kroma-chat__product-features";
  features.forEach((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    list.append(item);
  });
  return list;
}
