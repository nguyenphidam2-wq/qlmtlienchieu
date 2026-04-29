const BASE = "http://localhost:3000";
let sessionCookie = "";

function green(msg)  { console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`); }
function red(msg)    { console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`); }

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: "admin", password: "123456" }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";").find(c => c.trim().startsWith("auth_token="))?.split("=")[1] || "";
    // Get full cookie string
    sessionCookie = setCookie.split(",").map(c => c.trim().split(";")[0]).join("; ");
  }
  return res.ok;
}

async function call(payload) {
  const res = await fetch(`${BASE}/api/import-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": sessionCookie,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ---- Tests ----

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

// ---- Run ----
(async () => {
  console.log("=== Import-Data API Integration Tests ===\n");

  // Login first to get session cookie
  const ok = await login();
  if (!ok) {
    console.error("❌ Cannot login. Is the dev server running?");
    process.exit(1);
  }
  console.log("✓ Logged in as admin\n");

  await test1_WrongSecret();
  await test2_MissingCollection();
  await test3_DataIsString();
  await test4_UnsupportedCollection();
  await test5_HappyPath();

  console.log("\n=== Done ===");
})();