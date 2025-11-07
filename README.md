# CUPID Payment System POC

CUPID (Cryptographic Universal Payment ID) is a decentralized payment system that allows users to send and receive payments using human-readable identifiers across any network.

## Overview

This project demonstrates a proof-of-concept implementation of the CUPID payment system, consisting of smart contracts for ID registration and payments, along with a React-based user interface.

## Features

- Register CUPID IDs (e.g., @username@cupid)
- Send payments to registered CUPID IDs
- Request payments from other users
- View registered CUPID IDs
- Track payment requests and their status
- Seamless integration with MetaMask wallet
- Built on Polygon's Amoy testnet

## Project Structure

```
cupid-poc/
├── contracts/              # Smart contract source files
│   ├── CupidIDRegistry.sol # ID registration contract
│   └── CupidPayment.sol    # Payment handling contract
├── cupid-ui/              # React frontend application
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── RegisterCupidID.js    # ID registration component
│   │   ├── RegisteredIDs.js      # ID listing component
│   │   ├── RequestPayment.js     # Payment request component
│   │   ├── PaymentRequests.js    # Payment request listing
│   │   └── Settings.js           # User settings
├── scripts/               # Deployment and test scripts
└── test/                 # Contract test files
```

## Prerequisites

- Node.js and npm
- MetaMask browser extension
- Some POL (Polygon testnet tokens)

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install contract dependencies
   npm install

   # Install UI dependencies
   cd cupid-ui
   npm install
   ```

3. Configure MetaMask:

   - Add Amoy testnet (Chain ID: 80002)
   - RPC URL: https://rpc-amoy.polygon.technology
   - Get some test POL tokens

4. Start the development server:
   ```bash
   cd cupid-ui
   npm start
   ```

## Usage

1. **Register a CUPID ID:**

   - Click on "Register ID"
   - Enter your desired username (e.g., @alice@cupid)
   - Confirm the transaction in MetaMask

2. **Send Payments:**

   - Click on "Send Payment"
   - Enter recipient's CUPID ID and amount
   - Confirm the transaction

3. **Request Payments:**

   - Click on "Request Payment"
   - Enter the CUPID ID and amount
   - Send the request

4. **View Registered IDs:**
   - The list of registered IDs is visible in the main interface
   - Click on an ID to autofill it for payments

## Smart Contracts

- **CupidIDRegistry**: Manages the registration and mapping of CUPID IDs to Ethereum addresses
- **CupidPayment**: Handles payment transactions between registered users

Contract Address (Amoy Testnet):

- CupidPayment: `0xFFCdb0585811ac285611e78B3b4448EFf30077ab`

## Technical Stack

- Solidity (Smart Contracts)
- Hardhat (Development Environment)
- React.js (Frontend)
- ethers.js (Blockchain Interaction)
- MetaMask (Wallet Integration)
- Polygon Amoy Testnet

## Development

To deploy new contracts:

```bash
npx hardhat run scripts/deploy.js --network amoy
```

To run tests:

```bash
npx hardhat test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

This is a proof-of-concept implementation and has not been audited. Do not use in production without proper security review.
