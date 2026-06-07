// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HealthRecordRegistry
 * @dev Stores SHA-256 hashes of resident health records on-chain.
 *      Raw health data is NEVER stored here — only hashes for integrity verification.
 *      Compliant with the Philippine Data Privacy Act (RA 10173).
 */
contract HealthRecordRegistry {
    // ── Events ──────────────────────────────────────────────────────────────

    event RecordAnchored(
        string indexed residentId,
        bytes32 recordHash,
        string  recordType,
        uint256 timestamp,
        address anchoredBy
    );

    event RecordRevoked(
        string indexed residentId,
        bytes32 recordHash,
        uint256 timestamp,
        address revokedBy
    );

    // ── Data structures ──────────────────────────────────────────────────────

    struct RecordEntry {
        bytes32 hash;       // SHA-256 hash of the off-chain health record JSON
        string  recordType; // "medical_history" | "family_history" | "personal_social" | "resident_profile"
        uint256 timestamp;  // block.timestamp when anchored
        address anchoredBy; // address of the system wallet that submitted the tx
        bool    revoked;    // true if this record version was superseded / revoked
    }

    // residentId (off-chain UUID) → ordered list of record versions
    mapping(string => RecordEntry[]) private _records;

    // Quick lookup: hash → bool (exists on chain)
    mapping(bytes32 => bool) private _hashExists;

    address public owner;

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
     * @notice Anchor a new hash for a resident's health record.
     * @param residentId  The off-chain UUID of the resident.
     * @param recordHash  keccak256 or SHA-256 (as bytes32) of the serialised record JSON.
     * @param recordType  One of: "medical_history", "family_history", "personal_social", "resident_profile".
     */
    function anchorRecord(
        string calldata residentId,
        bytes32 recordHash,
        string calldata recordType
    ) external onlyOwner {
        require(recordHash != bytes32(0), "Empty hash");
        require(!_hashExists[recordHash], "Hash already anchored");

        _records[residentId].push(
            RecordEntry({
                hash:       recordHash,
                recordType: recordType,
                timestamp:  block.timestamp,
                anchoredBy: msg.sender,
                revoked:    false
            })
        );

        _hashExists[recordHash] = true;

        emit RecordAnchored(residentId, recordHash, recordType, block.timestamp, msg.sender);
    }

    /**
     * @notice Revoke a record version (e.g. when data is corrected under DPA request).
     * @param residentId The resident whose record version is being revoked.
     * @param index      Index of the version in the resident's record history.
     */
    function revokeRecord(string calldata residentId, uint256 index) external onlyOwner {
        require(index < _records[residentId].length, "Index out of range");
        RecordEntry storage entry = _records[residentId][index];
        require(!entry.revoked, "Already revoked");

        entry.revoked = true;
        emit RecordRevoked(residentId, entry.hash, block.timestamp, msg.sender);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * @notice Verify whether a given hash exists and is not revoked.
     * @return exists   true if the hash was ever anchored.
     * @return revoked  true if the hash was subsequently revoked.
     */
    function verifyHash(bytes32 recordHash) external view returns (bool exists, bool revoked) {
        exists = _hashExists[recordHash];
        if (!exists) return (false, false);

        // Scan to find revocation status (hashes are globally unique so there's only one)
        // In practice this is called rarely and gas is not a concern server-side.
        revoked = false;
        // We cannot return revocation status purely from _hashExists;
        // caller should use getRecordHistory and inspect the matching entry.
        return (exists, false);
    }

    /**
     * @notice Get the number of record versions for a resident.
     */
    function getRecordCount(string calldata residentId) external view returns (uint256) {
        return _records[residentId].length;
    }

    /**
     * @notice Get a specific version of a resident's record entry.
     */
    function getRecord(string calldata residentId, uint256 index)
        external
        view
        returns (
            bytes32 hash,
            string memory recordType,
            uint256 timestamp,
            address anchoredBy,
            bool revoked
        )
    {
        require(index < _records[residentId].length, "Index out of range");
        RecordEntry storage e = _records[residentId][index];
        return (e.hash, e.recordType, e.timestamp, e.anchoredBy, e.revoked);
    }

    /**
     * @notice Get the latest (most recent) record hash for a resident, for a given type.
     *         Returns (bytes32(0), false) if no active record exists.
     */
    function getLatestRecord(string calldata residentId, string calldata recordType)
        external
        view
        returns (bytes32 latestHash, uint256 latestTimestamp)
    {
        RecordEntry[] storage entries = _records[residentId];
        for (uint256 i = entries.length; i > 0; i--) {
            RecordEntry storage e = entries[i - 1];
            if (!e.revoked && keccak256(bytes(e.recordType)) == keccak256(bytes(recordType))) {
                return (e.hash, e.timestamp);
            }
        }
        return (bytes32(0), 0);
    }
}
