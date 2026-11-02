const { ethers } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  // Disuntik oleh `cmu deploy` sesuai network di cmu.config.js
  const rpcUrl = process.env.CMU_RPC_URL;
  const chainId = Number(process.env.CMU_CHAIN_ID);
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !chainId || !privateKey) {
    throw new Error(
      "CMU_RPC_URL / CMU_CHAIN_ID / PRIVATE_KEY tidak ada. Jalankan lewat `cmu deploy`, bukan node langsung.",
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, {
    cacheTimeout: -1,
    staticNetwork: true,
  });
  const wallet = new ethers.Wallet(privateKey, provider);

  // ABI + bytecode dibaca dari hasil `cmu compile`
  const artifact = JSON.parse(
    fs.readFileSync(path.resolve("artifacts", "Guestbook.json"), "utf8"),
  );
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.evm.bytecode.object,
    wallet,
  );

  console.log("Network  :", rpcUrl, `(chain ${chainId})`);
  console.log("Deployer :", wallet.address);
  console.log("Deploying Guestbook...");

  const guestbook = await factory.deploy();
  await guestbook.waitForDeployment();

  const address = await guestbook.getAddress();
  console.log("Guestbook deployed to:", address);
  console.log("Salin alamat di atas ke CONTRACT_ADDRESS di scripts/seed.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
