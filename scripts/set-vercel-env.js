const { execSync } = require('child_process');

const uri = "mongodb://admin:dannghi%402023@ac-ywyb5s8-shard-00-00.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-01.129xiqk.mongodb.net:27017,ac-ywyb5s8-shard-00-02.129xiqk.mongodb.net:27017/?authSource=admin&replicaSet=atlas-upfdpr-shard-0&tls=true";
const jwt = "qlmt-lienchieu-secret-key-2024";

try {
  console.log("Adding MONGODB_URI...");
  execSync(`npx vercel env add MONGODB_URI production --value "${uri}" --yes`);
  execSync(`npx vercel env add MONGODB_URI preview --value "${uri}" --yes`);
  execSync(`npx vercel env add MONGODB_URI development --value "${uri}" --yes`);
  
  console.log("Adding JWT_SECRET...");
  execSync(`npx vercel env add JWT_SECRET production --value "${jwt}" --yes`);
  execSync(`npx vercel env add JWT_SECRET preview --value "${jwt}" --yes`);
  execSync(`npx vercel env add JWT_SECRET development --value "${jwt}" --yes`);
  
  console.log("Success!");
} catch (e) {
  console.error("Error adding env vars:", e.message);
}
