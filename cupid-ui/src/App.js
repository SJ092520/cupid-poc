import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import CupidPaymentABI from "./CupidPayment.json";
import RegisteredIDs from "./RegisteredIDs";
import RegisterCupidID from "./RegisterCupidID";
import Settings from "./Settings";
import RequestPayment from "./RequestPayment";
import PaymentRequests from "./PaymentRequests";

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
      const contractAddress = "0xFFCdb0585811ac285611e78B3b4448EFf30077ab";
      const contract = new ethers.Contract(contractAddress, CupidPaymentABI.abi, signer);

      // Use receiverId and amount from either manual input or selected request
      const paymentReceiverId = selectedRequest ? selectedRequest.toId : receiverId;
      const paymentAmount = selectedRequest ? selectedRequest.amount : amount;

      const tx = await contract.sendPayment(paymentReceiverId, "polygon", {
        value: ethers.utils.parseEther(paymentAmount.toString())
      });

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
      // Convert error object to string message
      const errorMessage = typeof err === 'string' ? err : err?.message || err?.reason || JSON.stringify(err) || "Failed to send payment";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>💘 CUPID Testnet Demo</h2>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setCurrentView("send")}
          style={{
            marginRight: 8,
            background: currentView === "send" ? "#e0e0e0" : "transparent",
            padding: "8px 16px"
          }}
        >
          Send Payment
        </button>
        <button
          onClick={() => setCurrentView("request")}
          style={{
            marginRight: 8,
            background: currentView === "request" ? "#e0e0e0" : "transparent",
            padding: "8px 16px"
          }}
        >
          Request Payment
        </button>
        <button
          onClick={() => setCurrentView("register")}
          style={{
            marginRight: 8,
            background: currentView === "register" ? "#e0e0e0" : "transparent",
            padding: "8px 16px"
          }}
        >
          Register ID
        </button>
        <button
          onClick={() => setCurrentView("settings")}
          style={{
            background: currentView === "settings" ? "#e0e0e0" : "transparent",
            padding: "8px 16px"
          }}
        >
          Settings
        </button>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 16 }}>
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