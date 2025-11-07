// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CupidIDRegistry {
    struct Wallets {
        address ethereum;
        address polygon;
    }

    mapping(string => Wallets) private ids;

    event IDRegistered(string indexed id, address ethereum, address polygon);

    function registerID(
        string memory id,
        address ethAddr,
        address polyAddr
    ) public {
        ids[id] = Wallets(ethAddr, polyAddr);
        emit IDRegistered(id, ethAddr, polyAddr);
    }

    function resolve(
        string memory id,
        string memory chain
    ) public view returns (address) {
        if (keccak256(bytes(chain)) == keccak256(bytes("ethereum")))
            return ids[id].ethereum;
        else if (keccak256(bytes(chain)) == keccak256(bytes("polygon")))
            return ids[id].polygon;
        else revert("Unsupported chain");
    }
}