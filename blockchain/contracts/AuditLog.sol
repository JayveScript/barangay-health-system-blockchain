// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AuditLog
 * @dev Immutable on-chain audit trail for sensitive barangay health center events.
 *      Events are append-only; nothing can be deleted or altered after logging.
 *
 *      Use cases:
 *      - QR scan access events (who scanned whose record, outcome)
 *      - Resident referrals between barangays
 *      - Critical health record mutations (create, update)
 *      - Login anomalies / security incidents
 */
contract AuditLog {
    // ── Event types (mirrors QrScanAction and other app events) ──────────────

    uint8 public constant EVT_QR_SCAN_GRANTED   = 1;
    uint8 public constant EVT_QR_SCAN_DENIED    = 2;
    uint8 public constant EVT_RECORD_CREATED    = 3;
    uint8 public constant EVT_RECORD_UPDATED    = 4;
    uint8 public constant EVT_REFERRAL_CREATED  = 5;
    uint8 public constant EVT_REFERRAL_ACCEPTED = 6;
    uint8 public constant EVT_REFERRAL_REJECTED = 7;
    uint8 public constant EVT_APPT_BOOKED       = 8;
    uint8 public constant EVT_APPT_COMPLETED    = 9;

    // ── Structures ───────────────────────────────────────────────────────────

    struct AuditEntry {
        uint256 id;
        uint8   eventType;
        string  actorId;      // user/staff UUID (off-chain)
        string  targetId;     // resident/record UUID (off-chain)
        string  barangayId;   // which barangay
        bytes32 dataHash;     // optional: hash of the related data payload
        string  metadata;     // small JSON string (role, IP hash, etc.)
        uint256 timestamp;
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    AuditEntry[] private _log;
    uint256 private _counter;

    address public owner;

    // ── Events ───────────────────────────────────────────────────────────────

    event Logged(
        uint256 indexed id,
        uint8   indexed eventType,
        string  actorId,
        string  targetId,
        string  barangayId,
        bytes32 dataHash,
        uint256 timestamp
    );

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * @notice Append an audit event to the immutable log.
     * @param eventType  One of the EVT_* constants above.
     * @param actorId    UUID of the staff/user performing the action.
     * @param targetId   UUID of the resident or resource being acted on.
     * @param barangayId UUID of the barangay context.
     * @param dataHash   Optional keccak256 hash of the related payload (pass bytes32(0) to skip).
     * @param metadata   Small JSON string e.g. '{"role":"NURSE","ipHash":"0xabc"}'. Max 512 chars.
     * @return id        The sequential audit log entry ID.
     */
    function logEvent(
        uint8 eventType,
        string calldata actorId,
        string calldata targetId,
        string calldata barangayId,
        bytes32 dataHash,
        string calldata metadata
    ) external onlyOwner returns (uint256 id) {
        require(eventType >= 1 && eventType <= 9, "Unknown event type");
        require(bytes(metadata).length <= 512, "Metadata too long");

        id = _counter++;

        _log.push(AuditEntry({
            id:         id,
            eventType:  eventType,
            actorId:    actorId,
            targetId:   targetId,
            barangayId: barangayId,
            dataHash:   dataHash,
            metadata:   metadata,
            timestamp:  block.timestamp
        }));

        emit Logged(id, eventType, actorId, targetId, barangayId, dataHash, block.timestamp);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * @notice Total number of log entries.
     */
    function totalEntries() external view returns (uint256) {
        return _log.length;
    }

    /**
     * @notice Retrieve a single audit entry by ID.
     */
    function getEntry(uint256 id)
        external
        view
        returns (
            uint8   eventType,
            string memory actorId,
            string memory targetId,
            string memory barangayId,
            bytes32 dataHash,
            string memory metadata,
            uint256 timestamp
        )
    {
        require(id < _log.length, "Entry does not exist");
        AuditEntry storage e = _log[id];
        return (e.eventType, e.actorId, e.targetId, e.barangayId, e.dataHash, e.metadata, e.timestamp);
    }

    /**
     * @notice Retrieve a page of entries (newest-first friendly via offset+limit).
     * @param offset Starting index (0-based).
     * @param limit  Max entries to return (capped at 100).
     */
    function getEntries(uint256 offset, uint256 limit)
        external
        view
        returns (AuditEntry[] memory entries)
    {
        uint256 total = _log.length;
        if (offset >= total) return new AuditEntry[](0);

        uint256 cap = limit > 100 ? 100 : limit;
        uint256 end = offset + cap;
        if (end > total) end = total;

        entries = new AuditEntry[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            entries[i - offset] = _log[i];
        }
    }
}
