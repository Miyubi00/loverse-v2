import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const copyBaseline = "ui-redesign";
const localePaths = {
  id: "src/i18n/locales/id.ts",
  en: "src/i18n/locales/en.ts",
};
const errors = [];

function unwrap(node) {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

function readLocale(sourceText, sourcePath, exportName) {
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => ts.isIdentifier(item.name) && item.name.text === exportName);

  if (!declaration?.initializer) {
    throw new Error(`Could not find exported locale object '${exportName}' in ${sourcePath}`);
  }

  const values = new Map();
  const visit = (rawNode, parentPath) => {
    const node = unwrap(rawNode);
    if (ts.isObjectLiteralExpression(node)) {
      for (const member of node.properties) {
        if (!ts.isPropertyAssignment(member)) continue;
        const key = propertyName(member.name);
        if (key === null) continue;
        visit(member.initializer, parentPath ? `${parentPath}.${key}` : key);
      }
      return;
    }
    if (ts.isArrayLiteralExpression(node)) {
      node.elements.forEach((element, index) => visit(element, `${parentPath}[${index}]`));
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      values.set(parentPath, node.text);
    }
  };

  visit(declaration.initializer, "");
  return values;
}

function readCurrentLocale(language) {
  const sourcePath = localePaths[language];
  return readLocale(readFileSync(resolve(root, sourcePath), "utf8"), sourcePath, language);
}

function readBaseLocale(language) {
  const sourcePath = localePaths[language];
  const sourceText = execFileSync("git", ["show", `${copyBaseline}:${sourcePath}`], {
    cwd: root,
    encoding: "utf8",
  });
  return readLocale(sourceText, sourcePath, language);
}

function tokenList(value, pattern) {
  return [...value.matchAll(pattern)].map((match) => match[0]).sort();
}

const protectedTokens = {
  placeholders: /\{\{[^{}]+\}\}|\{[^{}]+\}/g,
  tagsAndTrans: /<\/?(?:[A-Za-z][^<>]*|\d+)>/g,
  numbers: /(?<![\w{])\d+(?:[.,]\d+)*(?:%|\+)?(?!\w|})/g,
};

function checkProtectedTokens(label, before, after) {
  for (const [kind, pattern] of Object.entries(protectedTokens)) {
    const oldTokens = tokenList(before, pattern);
    const newTokens = tokenList(after, pattern);
    if (JSON.stringify(oldTokens) !== JSON.stringify(newTokens)) {
      errors.push(`${label}: ${kind} changed (${JSON.stringify(oldTokens)} → ${JSON.stringify(newTokens)})`);
    }
  }
}

const current = { id: readCurrentLocale("id"), en: readCurrentLocale("en") };
const base = { id: readBaseLocale("id"), en: readBaseLocale("en") };
const idKeys = [...current.id.keys()].sort();
const enKeys = [...current.en.keys()].sort();

if (JSON.stringify(idKeys) !== JSON.stringify(enKeys)) {
  const idOnly = idKeys.filter((key) => !current.en.has(key));
  const enOnly = enKeys.filter((key) => !current.id.has(key));
  errors.push(`Locale key mismatch. ID only: ${idOnly.join(", ") || "none"}; EN only: ${enOnly.join(", ") || "none"}`);
}

for (const language of ["id", "en"]) {
  for (const [key, value] of current[language]) {
    if (!value.trim()) errors.push(`${language}.${key}: empty translation`);
  }
}

const changelog = readFileSync(resolve(root, "docs/copy-changelog.md"), "utf8");
const rows = changelog
  .split(/\r?\n/)
  .filter((line) => /^\|\s*`(?:home|order|customer|admin|toast)\./.test(line))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));

if (rows.length === 0) errors.push("No locale entries found in docs/copy-changelog.md");

for (const [rawKey, idPair, enPair] of rows) {
  const key = rawKey.replace(/^`|`$/g, "");
  const [oldId, newId] = idPair.split(" → ").map((value) => value.replace(/^`|`$/g, ""));
  const [oldEn, newEn] = enPair.split(" → ").map((value) => value.replace(/^`|`$/g, ""));

  if (!oldId || !newId || !oldEn || !newEn) {
    errors.push(`${key}: expected old and new ID/EN copy in changelog`);
    continue;
  }

  if (base.id.get(key) !== oldId) errors.push(`${key}: ID old text in changelog does not match HEAD`);
  if (base.en.get(key) !== oldEn) errors.push(`${key}: EN old text in changelog does not match HEAD`);
  if (current.id.get(key) !== newId) errors.push(`${key}: ID new text in changelog does not match locale`);
  if (current.en.get(key) !== newEn) errors.push(`${key}: EN new text in changelog does not match locale`);

  checkProtectedTokens(`${key} (ID)`, oldId, newId);
  checkProtectedTokens(`${key} (EN)`, oldEn, newEn);
}

if (errors.length) {
  console.error(`Copy checks failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Copy checks passed: ${idKeys.length} matching non-empty locale keys; ${rows.length} documented locale changes preserve placeholders, tags, and numbers.`);
}
