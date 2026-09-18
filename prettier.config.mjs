export default {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  importOrder: ["^node:", "<THIRD_PARTY_MODULES>", "^../(.*)$", "^./(.*)$"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
