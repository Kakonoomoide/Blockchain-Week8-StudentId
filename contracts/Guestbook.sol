// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Guestbook {
    struct Entry {
        uint256 id;
        address author;
        string name;
        string message;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    uint256 public nextId;      // id berikutnya (tidak pernah dipakai ulang)
    uint256 public activeCount; // jumlah entri yang masih ada
    mapping(uint256 => Entry) private entries;

    event Created(uint256 indexed id, address indexed author, string name, string message);
    event Updated(uint256 indexed id, address indexed author, string name, string message);
    event Deleted(uint256 indexed id, address indexed author);

    modifier onlyAuthor(uint256 _id) {
        require(entries[_id].exists, "Entri tidak ada");
        require(entries[_id].author == msg.sender, "Bukan penulis entri");
        _;
    }

    function _validate(string calldata _name, string calldata _message) private pure {
        require(bytes(_name).length > 0, "Nama tidak boleh kosong");
        require(bytes(_message).length > 0, "Pesan tidak boleh kosong");
        require(bytes(_name).length <= 50, "Nama max 50 karakter");
        require(bytes(_message).length <= 280, "Pesan max 280 karakter");
    }

    // CREATE
    function create(string calldata _name, string calldata _message) external returns (uint256 id) {
        _validate(_name, _message);
        id = nextId++;
        entries[id] = Entry(id, msg.sender, _name, _message, block.timestamp, block.timestamp, true);
        activeCount++;
        emit Created(id, msg.sender, _name, _message);
    }

    // READ satu entri
    function read(uint256 _id) external view returns (Entry memory) {
        require(entries[_id].exists, "Entri tidak ada");
        return entries[_id];
    }

    // READ semua entri yang masih ada
    function getAll() external view returns (Entry[] memory) {
        Entry[] memory result = new Entry[](activeCount);
        uint256 j;
        for (uint256 i = 0; i < nextId; i++) {
            if (entries[i].exists) {
                result[j] = entries[i];
                j++;
            }
        }
        return result;
    }

    // UPDATE (hanya penulis)
    function update(uint256 _id, string calldata _name, string calldata _message)
        external
        onlyAuthor(_id)
    {
        _validate(_name, _message);
        Entry storage e = entries[_id];
        e.name = _name;
        e.message = _message;
        e.updatedAt = block.timestamp;
        emit Updated(_id, msg.sender, _name, _message);
    }

    // DELETE (hanya penulis)
    function remove(uint256 _id) external onlyAuthor(_id) {
        delete entries[_id];
        activeCount--;
        emit Deleted(_id, msg.sender);
    }
}