const { ethers } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");

// ===== KONFIGURASI (edit bagian ini saja) =====
const RPC_URL = "http://10.64.24.101:8585";
const CHAIN_ID = 1912;
const CONTRACT_ADDRESS = "0x183a36316AaA508b20E00Ec46052E833acF8fd1b";
const ABI_PATH = path.resolve("artifacts", "Guestbook.json");

const SEED_DATA = [
  ["Budi", "Halo dari Jogja!"],
  ["Sari", "Guestbook pertama di CointMU"],
  ["Andi", "Tes seed nomor tiga"],
];
// ==============================================

// Hanya PRIVATE_KEY yang dibaca dari .env
try {
  process.loadEnvFile(".env");
} catch {}

function loadAbi(file) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(json) ? json : json.abi;
}

async function seed(contract, data = SEED_DATA) {
  for (const [name, message] of data) {
    const tx = await contract.create(name, message);
    await tx.wait(); // satu-satu biar nonce rapi
    console.log(`  + ${name}: ${message}`);
  }
  console.log("Entri aktif:", (await contract.activeCount()).toString());
}

async function main() {
  if (!ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error(
      "CONTRACT_ADDRESS belum diisi dengan benar di bagian atas seed.js",
    );
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY belum diisi di file .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, {
    cacheTimeout: -1,
    staticNetwork: true,
  });

  if ((await provider.getCode(CONTRACT_ADDRESS)) === "0x") {
    throw new Error(
      `Tidak ada contract di ${CONTRACT_ADDRESS} pada ${RPC_URL}`,
    );
  }

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const gb = new ethers.Contract(CONTRACT_ADDRESS, loadAbi(ABI_PATH), wallet);

  console.log("Contract :", CONTRACT_ADDRESS);
  console.log("Seeder   :", wallet.address);
  await seed(gb);
}

module.exports = { seed, loadAbi };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
