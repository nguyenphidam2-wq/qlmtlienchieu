yjet,const BASE = "http://localhost:3000";

function green(msg) { console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`); }
function red(msg) { console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`); }
function yellow(msg) { console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`); }

async function call(payload) {
  const res = await fetch(`${BASE}/api/import-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// Scenario 1: Wrong secret
async function test1_WrongSecret() {
  const { status, body } = await call({
    collection: "subjects",
    data: [{ name: "test" }],
    secret: "wrong-secret",
  });
  if (status === 401 && body.message === "Unauthorized") {
    green("Security: Wrong secret → 401 Unauthorized");
  } else {
    red(`Security: Wrong secret → expected 401, got ${status}: ${JSON.stringify(body)}`);
  }
}

// Scenario 2: Missing collection
async function test2_MissingCollection() {
  const { status, body } = await call({
    data: [{ name: "test" }],
    secret: "import-qlmt-2024",
  });
  if (status === 400 && body.message === "Invalid payload") {
    green("Validation 1: Missing collection → 400 Invalid payload");
  } else {
    red(`Validation 1: Missing collection → expected 400, got ${status}: ${JSON.stringify(body)}`);
  }
}

// Scenario 3: data is string instead of array
async function test3_DataIsString() {
  const { status, body } = await call({
    collection: "subjects",
    data: "not-an-array",
    secret: "import-qlmt-2024",
  });
  if (status === 400 && body.message === "Invalid payload") {
    green("Validation 2: data as string → 400 Invalid payload");
  } else {
    red(`Validation 2: data as string → expected 400, got ${status}: ${JSON.stringify(body)}`);
  }
}

// Scenario 4: Unsupported collection
async function test4_UnsupportedCollection() {
  const { status, body } = await call({
    collection: "hack_hacked",
    data: [{ name: "test" }],
    secret: "import-qlmt-2024",
  });
  if (status === 400 && body.message === "Collection not supported") {
    green("Module Ảo: hack_hacked → 400 Collection not supported");
  } else {
    red(`Module Ảo: hack_hacked → expected 400, got ${status}: ${JSON.stringify(body)}`);
  }
}

// Scenario 5: Happy path
async function test5_HappyPath() {
  const testData = [
    { name: "Test Subject 1", id: "TEST-001", createdAt: new Date().toISOString() },
    { name: "Test Subject 2", id: "TEST-002", createdAt: new Date().toISOString() },
  ];
  const { status, body } = await call({
    collection: "subjects",
    data: testData,
    secret: "import-qlmt-2024",
  });
  if (status === 200 && body.count === 2) {
    green(`Happy Path: 2 records imported → 200 OK, count=${body.count}`);
  } else {
    red(`Happy Path: expected 200 + count=2, got ${status}: ${JSON.stringify(body)}`);
  }
}

// Run all tests sequentially
(async () => {
  console.log("=== Import-Data API Integration Tests ===\n");
  await test1_WrongSecret();
  await test2_MissingCollection();
  await test3_DataIsString();
  await test4_UnsupportedCollection();
  await test5_HappyPath();
  console.log("\n=== Done ===");
})();