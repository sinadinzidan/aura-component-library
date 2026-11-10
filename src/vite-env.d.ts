/// <reference types="vite/client" />

declare module 'virtual:catalog-index' {
  const index: {
    area: string;
    id: string;
    title: string;
    sections: { id: string; title: string; specimens: { id: string; title: string; note: string; origin: string }[] }[];
  }[];
  export default index;
}
