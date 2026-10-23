// Mini test runner sin dependencias: funciona en el navegador (tests/index.html) y en Node 18+ (node tests/run-node.mjs).
const tests = [];

export function test(name, fn) {
  tests.push({ name, fn });
}

export function assert(cond, msg = 'assert falló') {
  if (!cond) throw new Error(msg);
}

export function assertEq(a, b, msg = '') {
  if (a !== b) throw new Error(`${msg} esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`);
}

export async function run(report = console.log) {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      report(`✔ ${t.name}`, true);
    } catch (e) {
      failures.push({ name: t.name, error: e });
      report(`✘ ${t.name}: ${e.message}`, false);
    }
  }
  report(`\n${passed}/${tests.length} tests OK`, failures.length === 0);
  return { passed, total: tests.length, failures };
}
