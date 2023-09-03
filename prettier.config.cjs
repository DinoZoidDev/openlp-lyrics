/** @type {import("prettier").Config & { [key:string]: any }} */
const config = {
	arrowParens: "always",
	printWidth: 80,
	singleQuote: false,
	jsxSingleQuote: false,
	semi: true,
	trailingComma: "all",
	tabWidth: 4,
	plugins: [
		"@ianvs/prettier-plugin-sort-imports",
		"prettier-plugin-tailwindcss"
	],
	tailwindConfig: "./tailwind.config.ts",
	importOrder: [
		"^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
		"^(next/(.*)$)|^(next$)",
		"^(expo(.*)$)|^(expo$)",
		"<THIRD_PARTY_MODULES>",
		"",
		"^~/utils/(.*)$",
		"^~/components/(.*)$",
		"^~/styles/(.*)$",
		"^~/(.*)$",
		"^[./]"
	],
	importOrderSeparation: false,
	importOrderSortSpecifiers: true,
	importOrderBuiltinModulesToTop: true,
	importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
	importOrderMergeDuplicateImports: true,
	importOrderCombineTypeAndValueImports: true
};

module.exports = config;
