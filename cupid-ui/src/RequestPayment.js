import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CupidRegistryABI from './CupidRegistry.json';

function RequestPayment({ provider }) {
    const AMOY_CHAIN_ID = "0x13882"; // Amoy testnet chain ID (80002 in hex)

    const [cupidId, setCupidId] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myIds, setMyIds] = useState([]);
    const [selectedId, setSelectedId] = useState('');

    // Load user's CUPID IDs
    useEffect(() => {
        async function loadMyIds() {
            if (!provider) {
                setError('Please connect your wallet');
                return;
            }

            try {
                setLoading(true);

                // Check network
                const network = await provider.getNetwork();
                if (network.chainId !== parseInt(AMOY_CHAIN_ID, 16)) {
                    setError('Please switch to Amoy testnet');
                    return;
                }

                const signer = provider.getSigner();
                const address = await signer.getAddress();

                const registryAddress = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936";
                const registry = new ethers.Contract(registryAddress, CupidRegistryABI.abi, provider);

                const filter = registry.filters.IDRegistered();
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 10000);
                const events = await registry.queryFilter(filter, fromBlock, 'latest');

                const myIdMap = new Map();
                events.forEach(event => {
                    try {
                        if (event && event.args) {
                            const id = event.args.id?.toString();
                            const ethereum = event.args.ethereum?.toString();
                            const polygon = event.args.polygon?.toString();

                            if (id && ethereum && polygon &&
                                (ethereum.toLowerCase() === address.toLowerCase() ||
                                    polygon.toLowerCase() === address.toLowerCase())) {
                                myIdMap.set(id, { id, ethereum, polygon });
                            }
                        }
                    } catch (err) {
                        console.error('Error processing event:', err);
                    }
                });

                const processedIds = Array.from(myIdMap.values()).filter(id =>
                    id && typeof id.id === 'string' &&
                    typeof id.ethereum === 'string' &&
                    typeof id.polygon === 'string'
                );

                setMyIds(processedIds);
            } catch (err) {
                console.error('Error loading IDs:', err);
                setError('Failed to load your CUPID IDs');
            } finally {
                setLoading(false);
            }
        }

        loadMyIds();
    }, [provider]);

    async function createRequest(e) {
        e.preventDefault();
        if (!provider) {
            setError('Please connect MetaMask first');
            return;
        }

        if (!selectedId) {
            setError('Please select your CUPID ID');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Create a payment request object
            const request = {
                fromId: cupidId,
                toId: selectedId,
                amount: amount,
                timestamp: Date.now(),
                status: 'pending'
            };

            // In a production app, this would be stored in a backend database
            // For demo, we'll use localStorage
            const requests = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
            requests.push(request);
            localStorage.setItem('paymentRequests', JSON.stringify(requests));

            // Clear form and show success message
            setCupidId('');
            setAmount('');
            alert('Payment request created successfully!');
        } catch (err) {
            console.error(err);
            const errorMessage = typeof err === 'string' ? err : err?.message || 'Failed to create payment request';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    if (loading && myIds.length === 0) return <div>Loading your CUPID IDs...</div>;
    if (!loading && myIds.length === 0) return <div>You need to register a CUPID ID first to request payments</div>;

    return (
        <div style={{ marginTop: 32, maxWidth: 500 }}>
            <h3>Request Payment</h3>
            {error && (
                <div style={{ color: 'red', marginBottom: 16 }}>
                    Error: {error}
                </div>
            )}
            <form onSubmit={createRequest}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Your CUPID ID
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            required
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading}
                        >
                            <option value="">Select your CUPID ID...</option>
                            {myIds.map(id => (
                                <option key={id.id} value={id.id}>{id.id}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Request From (CUPID ID)
                        <input
                            value={cupidId}
                            onChange={(e) => setCupidId(e.target.value)}
                            placeholder="@username@cupid"
                            required
                            pattern="^@[a-zA-Z0-9_]+@cupid$"
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Amount (POL)
                        <input
                            type="number"
                            step="0.000001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.0"
                            required
                            min="0"
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading || !cupidId || !amount || !selectedId}
                    style={{ padding: '8px 16px' }}
                >
                    {loading ? 'Creating Request...' : 'Request Payment'}
                </button>
            </form>
        </div>
    );
}

export default RequestPayment;
