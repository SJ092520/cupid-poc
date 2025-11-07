// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICupidRegistry {
    function resolve(string memory id, string memory chain) external view returns (address);
}

contract CupidPayment {
    ICupidRegistry public registry;

    event PaymentSent(address indexed from, string receiverId, uint256 amount, string destChain);

    constructor(address _registry) {
        registry = ICupidRegistry(_registry);
    }

    function sendPayment(string memory receiverId, string memory destChain) external payable {
        address to = registry.resolve(receiverId, destChain);
        require(to != address(0), "Invalid ID");
        payable(to).transfer(msg.value);
        emit PaymentSent(msg.sender, receiverId, msg.value, destChain);
    }
}