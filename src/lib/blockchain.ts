
import { ethers } from "ethers";
import crypto from "crypto";


const HEALTH_RECORD_REGISTRY_ABI = [
  "function anchorRecord(string calldata residentId, bytes32 recordHash, string calldata recordType) external",
  "function revokeRecord(string calldata residentId, uint256 index) external",
  "function verifyHash(bytes32 recordHash) external view returns (bool exists, bool revoked)",
  "function getRecordCount(string calldata residentId) external view returns (uint256)",
  "function getRecord(string calldata residentId, uint256 index) external view returns (bytes32 hash, string memory recordType, uint256 timestamp, address anchoredBy, bool revoked)",
  "function getLatestRecord(string calldata residentId, string calldata recordType) external view returns (bytes32 latestHash, uint256 latestTimestamp)",
  "event RecordAnchored(string indexed residentId, bytes32 recordHash, string recordType, uint256 timestamp, address anchoredBy)",
];

const AUDIT_LOG_ABI = [
  "function logEvent(uint8 eventType, string calldata actorId, string calldata targetId, string calldata barangayId, bytes32 dataHash, string calldata metadata) external returns (uint256 id)",
  "function totalEntries() external view returns (uint256)",
  "function getEntry(uint256 id) external view returns (uint8 eventType, string memory actorId, string memory targetId, string memory barangayId, bytes32 dataHash, string memory metadata, uint256 timestamp)",
  "event Logged(uint256 indexed id, uint8 indexed eventType, string actorId, string targetId, string barangayId, bytes32 dataHash, uint256 timestamp)",
];


export const AuditEventType = {
  QR_SCAN_GRANTED:   1,
  QR_SCAN_DENIED:    2,
  RECORD_CREATED:    3,
  RECORD_UPDATED:    4,
  REFERRAL_CREATED:  5,
  REFERRAL_ACCEPTED: 6,
  REFERRAL_REJECTED: 7,
  APPT_BOOKED:       8,
  APPT_COMPLETED:    9,
} as const;

export type AuditEventTypeValue = (typeof AuditEventType)[keyof typeof AuditEventType];

export type RecordType =
  | "medical_history"
  | "family_history"
  | "personal_social"
  | "resident_profile"
  | "bmi_record"
  | "referral";


let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _registry: ethers.Contract | null = null;
let _auditLog: ethers.Contract | null = null;

function getBlockchainClient() {
  if (_provider && _wallet && _registry && _auditLog) {
    return { provider: _provider, wallet: _wallet, registry: _registry, auditLog: _auditLog };
  }

  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  const registryAddress = process.env.HEALTH_RECORD_REGISTRY_ADDRESS;
  const auditLogAddress = process.env.AUDIT_LOG_ADDRESS;

  if (!rpcUrl || !privateKey || !registryAddress || !auditLogAddress) {
    throw new Error(
      "Blockchain env vars not set. Add BLOCKCHAIN_RPC_URL, BLOCKCHAIN_PRIVATE_KEY, " +
      "HEALTH_RECORD_REGISTRY_ADDRESS, and AUDIT_LOG_ADDRESS to your .env"
    );
  }

  _provider = new ethers.JsonRpcProvider(rpcUrl);
  _wallet = new ethers.Wallet(privateKey, _provider);
  _registry = new ethers.Contract(registryAddress, HEALTH_RECORD_REGISTRY_ABI, _wallet);
  _auditLog = new ethers.Contract(auditLogAddress, AUDIT_LOG_ABI, _wallet);

  return { provider: _provider, wallet: _wallet, registry: _registry, auditLog: _auditLog };
}


export function hashRecord(data: object): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return "0x" + hash;
}

export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + process.env.IP_HASH_SALT || "bhcms").digest("hex").slice(0, 16);
}


export async function anchorRecord(
  residentId: string,
  recordData: object,
  recordType: RecordType
): Promise<{ txHash: string; recordHash: string }> {
  const { registry } = getBlockchainClient();
  const recordHash = hashRecord(recordData);

  const tx = await registry.anchorRecord(residentId, recordHash, recordType);
  const receipt = await tx.wait();

  return { txHash: receipt.hash, recordHash };
}

export async function verifyRecord(
  residentId: string,
  recordData: object,
  recordType: RecordType
): Promise<{ verified: boolean; onChainHash: string; currentHash: string; timestamp: number }> {
  const { registry } = getBlockchainClient();
  const currentHash = hashRecord(recordData);

  const [onChainHash, timestampBig] = await registry.getLatestRecord(residentId, recordType);
  const onChainHashHex: string = onChainHash;
  const timestamp = Number(timestampBig);

  return {
    verified: onChainHashHex.toLowerCase() === currentHash.toLowerCase(),
    onChainHash: onChainHashHex,
    currentHash,
    timestamp,
  };
}

export async function getRecordHistory(
  residentId: string,
  recordType: RecordType
): Promise<Array<{ hash: string; recordType: string; timestamp: number; anchoredBy: string; revoked: boolean }>> {
  const { registry } = getBlockchainClient();
  const count = Number(await registry.getRecordCount(residentId));
  const history = [];

  for (let i = 0; i < count; i++) {
    const [hash, rType, timestamp, anchoredBy, revoked] = await registry.getRecord(residentId, i);
    if (rType === recordType) {
      history.push({
        hash,
        recordType: rType,
        timestamp: Number(timestamp),
        anchoredBy,
        revoked,
      });
    }
  }

  return history;
}


export async function logAuditEvent(
  eventType: AuditEventTypeValue,
  actorId: string,
  targetId: string,
  barangayId: string,
  dataHash?: string | null,
  meta?: Record<string, string> | null
): Promise<{ auditId: number; txHash: string }> {
  const { auditLog } = getBlockchainClient();

  const hashBytes32 = dataHash ?? ethers.ZeroHash;
  const metaStr = meta ? JSON.stringify(meta).slice(0, 512) : "";

  const tx = await auditLog.logEvent(
    eventType,
    actorId,
    targetId,
    barangayId,
    hashBytes32,
    metaStr
  );
  const receipt = await tx.wait();

  const iface = new ethers.Interface(AUDIT_LOG_ABI);
  let auditId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "Logged") {
        auditId = Number(parsed.args.id);
        break;
      }
    } catch {
    }
  }

  return { auditId, txHash: receipt.hash };
}

export async function getAuditEntry(id: number): Promise<{
  eventType: number;
  actorId: string;
  targetId: string;
  barangayId: string;
  dataHash: string;
  metadata: string;
  timestamp: number;
}> {
  const { auditLog } = getBlockchainClient();
  const [eventType, actorId, targetId, barangayId, dataHash, metadata, timestamp] =
    await auditLog.getEntry(id);

  return {
    eventType: Number(eventType),
    actorId,
    targetId,
    barangayId,
    dataHash,
    metadata,
    timestamp: Number(timestamp),
  };
}

export async function isBlockchainReachable(): Promise<boolean> {
  try {
    const { provider } = getBlockchainClient();
    await provider.getBlockNumber();
    return true;
  } catch {
    return false;
  }
}
