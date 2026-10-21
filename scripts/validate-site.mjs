import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const js = readFileSync("app.js", "utf8");
const css = readFileSync("style.css", "utf8");
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const idSet = new Set(ids);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicates.length === 0, "Duplicate HTML id(s): " + [...new Set(duplicates)].join(", "));

const views = new Set([...html.matchAll(/\bid=["']view-([^"']+)["']/g)].map(match => match[1]));
const tabs = [...html.matchAll(/\bdata-tab=["']([^"']+)["']/g)].map(match => match[1]);
for (const tab of tabs) check(views.has(tab), 'Navigation tab "' + tab + '" has no matching #view-' + tab + ".");
for (const target of [...html.matchAll(/\bdata-goto=["']([^"']+)["']/g)].map(match => match[1])) {
  check(views.has(target), 'Navigation target "' + target + '" has no matching #view-' + target + ".");
}
check(tabs.length > 0, "No navigation tabs were found.");
check(/<link\b[^>]*href=["']style\.css(?:\?[^"']*)?["']/i.test(html), "index.html does not link style.css.");
check(/<script\b[^>]*src=["']app\.js(?:\?[^"']*)?["']/i.test(html), "index.html does not load app.js.");
check(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css), "Missing reduced-motion accessibility styles.");
check(/:focus-visible/.test(css), "Missing visible keyboard-focus styles.");
check(/textContent\s*=\s*String\(data\.reply/.test(js), "AI reply should be rendered as text, not HTML.");
check(!/\beval\s*\(|new\s+Function\s*\(/.test(js), "Avoid eval() and new Function() in public client JavaScript.");

if (errors.length) {
  console.error("GameHub validation failed:");
  for (const error of errors) console.error(" - " + error);
  process.exitCode = 1;
} else {
  console.log("GameHub validation passed: unique IDs, navigation targets, asset links, accessibility hooks, and safe AI text rendering.");
}
