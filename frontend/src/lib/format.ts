export function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function testLabel(title: string, id: string | number) {
  return `${title} #${id}`;
}
