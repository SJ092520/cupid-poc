import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CupidPaymentABI from "./CupidPayment.json";
import CupidRegistryABI from "./CupidRegistry.json";
import RegisteredIDs from "./RegisteredIDs";
import RegisterCupidID from "./RegisterCupidID";
import Settings from "./Settings";
import RequestPayment from "./RequestPayment";
import PaymentRequests from "./PaymentRequests";
import "./styles.css";

function App() {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [currentView, setCurrentView] = useState("send"); // "send", "register", or "settings"
  const [connected, setConnected] = useState(false);

  const AMOY_CHAIN_ID = "0x13882"; // Amoy testnet chain ID (80002 in hex)
  const REGISTRY_ADDRESS = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936"; // Registry contract address
  const PAYMENT_ADDRESS = "0xFFCdb0585811ac285611e78B3b4448EFf30077ab"; // Payment contract address

  // Initialize provider when MetaMask is available
  useEffect(() => {
    async function setupProvider() {
      if (window.ethereum) {
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.providers.Web3Provider(window.ethereum);

          // Ensure we're on the correct network
          await checkAndSwitchNetwork(provider);

          setProvider(provider);
          setConnected(true);
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
          setError('Please connect your MetaMask wallet');
        }
      }
    }
    setupProvider();
  }, []);

  async function checkAndSwitchNetwork(provider) {
    const network = await provider.getNetwork();
    if (network.chainId !== parseInt(AMOY_CHAIN_ID, 16)) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: AMOY_CHAIN_ID }],
        });
      } catch (switchError) {
        // Chain not added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: AMOY_CHAIN_ID,
                chainName: "Amoy Testnet",
                nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
                rpcUrls: ["https://rpc-amoy.polygon.technology"],
                blockExplorerUrls: ["https://amoy.polygonscan.com/"]
              }]
            });
          } catch (addError) {
            throw new Error("Please add Amoy network to MetaMask manually");
          }
        } else {
          throw switchError;
        }
      }
    }
  }

  // Handle selection of a payment request
  function handleRequestSelection(request) {
    setSelectedRequest(request);
    setReceiverId(request.toId);
    setAmount(request.amount);
  }

  async function sendPayment() {
    if (!window.ethereum) {
      setError("Please install MetaMask");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Ensure we're on Mumbai testnet
      await checkAndSwitchNetwork(provider);

      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("Sender address:", userAddress);

      // Get the ID and amount from either the selected request or manual input
      let paymentReceiverId = selectedRequest ? selectedRequest.toId : receiverId;
      const paymentAmount = selectedRequest ? selectedRequest.amount : amount;

      // Format CUPID ID - remove @ if present at the start
      // if (paymentReceiverId.startsWith('@')) {
      //   paymentReceiverId = paymentReceiverId.substring(1);
      // }
      // // Remove @cupid if present at the end
      // if (paymentReceiverId.endsWith('@cupid')) {
      //   paymentReceiverId = paymentReceiverId.slice(0, -6);
      // }

      console.log("Attempting to send payment to CUPID ID:", paymentReceiverId);

      // First validate the CUPID ID using the registry contract
      const registryContract = new ethers.Contract(
        REGISTRY_ADDRESS,
        CupidRegistryABI.abi,
        provider
      );

      // Validate CUPID ID before proceeding with payment
      try {
        if (!paymentReceiverId) {
          throw new Error("CUPID ID cannot be empty");
        }

        console.log("Registry Contract Address:", REGISTRY_ADDRESS);
        console.log("Checking CUPID ID:", paymentReceiverId);

        // Try to get network first
        const network = await provider.getNetwork();
        console.log("Current network:", network);

        // Check contract code exists at address
        const code = await provider.getCode(REGISTRY_ADDRESS);
        if (code === '0x') {
          throw new Error('No contract code found at registry address');
        }

        // Try to resolve the address
        try {
          const resolvedAddress = await registryContract.resolve(paymentReceiverId, "polygon");
          console.log("Resolved address:", resolvedAddress);

          if (!resolvedAddress || resolvedAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error(`CUPID ID ${paymentReceiverId} is not registered`);
          }
        } catch (resolveError) {
          console.error("Resolve error:", resolveError);
          throw new Error(`Failed to resolve CUPID ID: ${resolveError.message}`);
        }
      } catch (error) {
        console.error("Registry error:", error);
        setError(error.message || "Failed to validate CUPID ID");
        setLoading(false);
        return;
      }

      // Set up payment contract
      console.log("Payment Contract Address:", PAYMENT_ADDRESS);

      // Check contract code exists at address
      const paymentCode = await provider.getCode(PAYMENT_ADDRESS);
      if (paymentCode === '0x') {
        throw new Error('No contract code found at payment contract address');
      }

      const paymentContract = new ethers.Contract(PAYMENT_ADDRESS, CupidPaymentABI.abi, signer);
      console.log("Payment contract instance created");

      // Convert the amount to Wei
      const amountInWei = ethers.utils.parseEther(paymentAmount.toString());
      console.log("Amount in Wei:", amountInWei.toString());

      // Try to estimate gas first
      const gasEstimate = await paymentContract.estimateGas.sendPayment(
        paymentReceiverId,
        "polygon",
        { value: amountInWei }
      );
      console.log("Estimated gas:", gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);
      console.log("Gas limit with buffer:", gasLimit.toString());

      // Try to send the payment
      const tx = await paymentContract.sendPayment(paymentReceiverId, "polygon", {
        value: amountInWei,
        gasLimit: gasLimit
      });

      console.log("Transaction sent:", tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      await tx.wait();

      // If this was a payment request, mark it as completed
      if (selectedRequest) {
        const requests = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
        const updatedRequests = requests.map(req => {
          if (req.timestamp === selectedRequest.timestamp &&
            req.fromId === selectedRequest.fromId &&
            req.toId === selectedRequest.toId) {
            return { ...req, status: 'completed' };
          }
          return req;
        });
        localStorage.setItem('paymentRequests', JSON.stringify(updatedRequests));
        setSelectedRequest(null);
      }

      // Clear form
      setAmount("");
      setReceiverId("");
      alert("Payment sent! Transaction hash: " + tx.hash);
    } catch (err) {
      console.error(err);

      // Handle specific error cases
      if (err.code === 'ACTION_REJECTED') {
        setError("Transaction was cancelled in MetaMask");
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        setError("Insufficient funds to complete the transaction");
      } else if (err.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your connection and try again");
      } else {
        // For other errors, try to get a meaningful message
        const errorMessage = err.reason || err.message || "Failed to send payment";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>💘 CUPID Testnet Demo</h2>

      <div className="mb-16">
        <button
          onClick={() => setCurrentView("send")}
          className={currentView === "send" ? "active" : ""}
        >
          Send Payment
        </button>
        <button
          onClick={() => setCurrentView("request")}
          className={currentView === "request" ? "active" : ""}
        >
          Request Payment
        </button>
        <button
          onClick={() => setCurrentView("register")}
          className={currentView === "register" ? "active" : ""}
        >
          Register ID
        </button>
        <button
          onClick={() => setCurrentView("settings")}
          className={currentView === "settings" ? "active" : ""}
        >
          Settings
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {currentView === "send" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            <h3>Send Payment</h3>
            {selectedRequest && (
              <div style={{
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "4px",
                marginBottom: "16px"
              }}>
                <div style={{ fontWeight: "bold" }}>Payment Request</div>
                <div>From: {selectedRequest.toId}</div>
                <div>Amount: {selectedRequest.amount} POL</div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <input
                placeholder="@bob@cupid"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                disabled={loading || selectedRequest}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                placeholder="Amount (POL)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading || selectedRequest}
                type="number"
                step="0.01"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <button
                onClick={sendPayment}
                disabled={loading || (!selectedRequest && (!receiverId || !amount))}
                style={{ marginRight: selectedRequest ? 8 : 0 }}
              >
                {loading ? "Sending..." : selectedRequest ? "Pay Request" : "Send"}
              </button>
              {selectedRequest && (
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setReceiverId("");
                    setAmount("");
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
              Network: Amoy Testnet (Polygon)
            </div>

            <PaymentRequests
              provider={provider}
              receiverId={receiverId}
              onSelectRequest={handleRequestSelection}
            />
          </div>
          <div>
            {connected && <RegisteredIDs provider={provider} />}
          </div>
        </div>
      )}
      {currentView === "request" && <RequestPayment provider={provider} />}
      {currentView === "register" && <RegisterCupidID provider={provider} />}
      {currentView === "settings" && <Settings provider={provider} />}
    </div>
  );
}

export default App;