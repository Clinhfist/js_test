#!/usr/bin/env node
// Запуск з кореня репозиторію сайту:  node tools/build-data.js
// Перетворює data/answers-db.js + data/scripts-db.js на JSON для розширення
// і рахує data/version.json (версія змінюється лише коли змінився вміст).
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(process.cwd(), "data");
const read = f => fs.readFileSync(path.join(DIR, f), "utf8");
const sha = s => crypto.createHash("sha256").update(s, "utf8").digest("hex");

// Зв'язок записів scripts-db.js з категоріями answers-db.js і типом обробника.
// Новий тест: додайте рядок сюди (або залиште без нього — тоді він буде лише в загальному пошуку).
const FILE_MAP = {
  "scripts/lean.js":        { type: "quiz",   answers: "LEAN" },
  "scripts/5S.js":        { type: "quiz",   answers: "5S" },
  "scripts/book1.js":       { type: "quiz",   answers: "Book1" },
  "scripts/book2.js":       { type: "quiz",   answers: "DANGER" },
  "scripts/BDF.js":         { type: "quiz",   answers: "BDF" },
  "scripts/neopoz.js":      { type: "quiz",   answers: "UNKNOWN" },
  "scripts/sortuvanya.js":  { type: "quiz",   answers: "SORTING" },
  "scripts/animal.js":       { type: "quiz",   answers: "animal" },
  "scripts/VidomistSkan.js":{ type: "quiz",   answers: "SCANNING" },
  "scripts/medicine.js":    { type: "quiz",   answers: "MEDICAL" },
  "scripts/teoria.js":      { type: "slides" },
  "scripts/skip.js":        { type: "video" }
};

// 1. Читаємо JS-бази в ізольованому контексті
const ctx = vm.createContext({});
vm.runInContext(read("answers-db.js") + ";this.A = ANSWERS_DB;", ctx);
vm.runInContext(read("scripts-db.js") + ";this.S = SCRIPTS_DB;", ctx);

const answers = JSON.parse(JSON.stringify(ctx.A));
const index = ctx.S.map(e => {
  const m = FILE_MAP[e.file];
  if (!m) console.warn(`⚠ ${e.file} немає в FILE_MAP — тип невідомий`);
  if (m?.answers && !(m.answers in answers)) console.warn(`⚠ категорії ${m.answers} немає в answers-db.js`);
  return { category: e.category, tag: e.tag, title: e.title, desc: e.desc, file: e.file, ...m };
});

// 2. Пишемо JSON (стабільний формат — щоб хеші не «плавали»)
const out = {
  "answers.json": JSON.stringify(answers, null, 1) + "\n",
  "index.json": JSON.stringify(index, null, 1) + "\n"
};
for (const [name, text] of Object.entries(out)) fs.writeFileSync(path.join(DIR, name), text);

// config.json редагується вручну (селектори, затримки); тут лише читаємо для хешу
if (!fs.existsSync(path.join(DIR, "config.json"))) {
  console.error("✖ data/config.json відсутній — скопіюйте його з розширення/репозиторію-шаблону");
  process.exit(1);
}
const files = {};
for (const name of ["answers.json", "index.json", "config.json"]) files[name] = { sha256: sha(read(name)) };

// 3. version.json: нова версія лише якщо хеші змінились
let prev = null;
try { prev = JSON.parse(read("version.json")); } catch (_) {}
const same = prev && Object.keys(files).every(k => prev.files?.[k]?.sha256 === files[k].sha256);
if (same) {
  console.log("Без змін, версія:", prev.version);
} else {
  const combined = sha(Object.values(files).map(f => f.sha256).join(""));
  const now = new Date();
  const version = `${now.toISOString().slice(0, 10)}.${combined.slice(0, 8)}`;
  const meta = { version, updated: now.toISOString(), files };
  fs.writeFileSync(path.join(DIR, "version.json"), JSON.stringify(meta, null, 1) + "\n");
  console.log("Нова версія:", version);
}
