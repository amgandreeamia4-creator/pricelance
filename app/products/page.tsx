// app/products/page.tsx
// Bridge page so Next.js (root app tree) can use the real implementation in src/app/products/page.tsx.

export { default } from "@/app/products/page";
export * from "@/app/products/page";
