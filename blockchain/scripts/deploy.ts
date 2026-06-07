import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // ── Deploy HealthRecordRegistry ──────────────────────────────────────────
  console.log("\nDeploying HealthRecordRegistry...");
  const HealthRecordRegistry = await ethers.getContractFactory("HealthRecordRegistry");
  const registry = await HealthRecordRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("HealthRecordRegistry deployed to:", registryAddress);

  // ── Deploy AuditLog ──────────────────────────────────────────────────────
  console.log("\nDeploying AuditLog...");
  const AuditLog = await ethers.getContractFactory("AuditLog");
  const auditLog = await AuditLog.deploy();
  await auditLog.waitForDeployment();
  const auditLogAddress = await auditLog.getAddress();
  console.log("AuditLog deployed to:", auditLogAddress);

  // ── Save addresses to deployment file ───────────────────────────────────
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      HealthRecordRegistry: registryAddress,
      AuditLog: auditLogAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outPath = path.join(deploymentsDir, "deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("\nDeployment info saved to:", outPath);

  // ── Print env vars to copy ───────────────────────────────────────────────
  console.log("\n── Add these to your .env ──────────────────────────────────────");
  console.log(`BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545`);
  console.log(`HEALTH_RECORD_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`AUDIT_LOG_ADDRESS=${auditLogAddress}`);
  console.log("─────────────────────────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
