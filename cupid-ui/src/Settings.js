import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CupidRegistryABI from './CupidRegistry.json';

function Settings({ provider }) {
    const AMOY_CHAIN_ID = "0x13882"; // Amoy testnet chain ID (80002 in hex)

    const [myIds, setMyIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [ethAddress, setEthAddress] = useState('');
    const [polyAddress, setPolyAddress] = useState('');

    // Load IDs owned by the current address
    useEffect(() => {
        async function loadMyIds() {
            console.log('Loading my CUPID IDs...');
            if (!provider) {
                setError('Please connect your wallet');
                return;
            }

            try {
                setLoading(true);

                // Check if user is connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (!accounts || accounts.length === 0) {
                    setError('Please connect your wallet');
                    return;
                }

                // Check network
                const network = await provider.getNetwork();
                if (network.chainId !== parseInt(AMOY_CHAIN_ID, 16)) {
                    setError('Please switch to Amoy testnet');
                    return;
                }

                const signer = provider.getSigner();
                const address = await signer.getAddress();
                console.log('Current address:', address);
                const registryAddress = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936";
                const registry = new ethers.Contract(registryAddress, CupidRegistryABI.abi, provider);

                // Get IDRegistered events where either address matches current user
                const filter = registry.filters.IDRegistered();
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10000 blocks
                const events = await registry.queryFilter(filter, fromBlock, 'latest');
                console.log(events);
                // Filter and deduplicate IDs where user owns either address
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

    async function updateAddresses(e) {
        e.preventDefault();
        if (!provider || !selectedId) return;

        setError('');
        setLoading(true);

        try {
            const signer = provider.getSigner();
            const registryAddress = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936";
            const registry = new ethers.Contract(registryAddress, CupidRegistryABI.abi, signer);

            // Validate addresses
            if (!ethers.utils.isAddress(ethAddress) || !ethers.utils.isAddress(polyAddress)) {
                throw new Error('Invalid Ethereum or Polygon address');
            }

            // Update the ID (this will overwrite existing registration)
            const tx = await registry.registerID(selectedId, ethAddress, polyAddress);
            await tx.wait();

            alert('Addresses updated successfully!');

            // Reload the IDs list
            setSelectedId('');
            setEthAddress('');
            setPolyAddress('');
            window.location.reload();
        } catch (err) {
            console.error(err);
            // Convert error object to string message
            const errorMessage = typeof err === 'string' ? err : err?.message || err?.reason || JSON.stringify(err) || 'Failed to update addresses';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    // When user selects an ID, populate current addresses
    function handleIdSelect(e) {
        const id = e.target.value;
        setSelectedId(id);
        if (id) {
            const idInfo = myIds.find(i => i.id === id);
            setEthAddress(idInfo.ethereum);
            setPolyAddress(idInfo.polygon);
        } else {
            setEthAddress('');
            setPolyAddress('');
        }
    }

    if (loading && myIds.length === 0) return <div>Loading your CUPID IDs...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (myIds.length === 0) return <div>You don't own any CUPID IDs yet.</div>;

    return (
        <div style={{ marginTop: 32, maxWidth: 500 }}>
            <h3>Update CUPID ID Addresses</h3>
            {error && (
                <div style={{ color: 'red', marginBottom: 16 }}>
                    Error: {error}
                </div>
            )}
            <form onSubmit={updateAddresses}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Select CUPID ID
                        <select
                            value={selectedId}
                            onChange={handleIdSelect}
                            required
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading}
                        >
                            <option value="">Choose an ID...</option>
                            {myIds.map(id => (
                                <option key={id.id} value={id.id}>{id.id}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Ethereum Address
                        <input
                            value={ethAddress}
                            onChange={(e) => setEthAddress(e.target.value)}
                            placeholder="0x..."
                            required
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading || !selectedId}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        Polygon Address
                        <input
                            value={polyAddress}
                            onChange={(e) => setPolyAddress(e.target.value)}
                            placeholder="0x..."
                            required
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading || !selectedId}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading || !selectedId || !ethAddress || !polyAddress}
                    style={{ padding: '8px 16px' }}
                >
                    {loading ? 'Updating...' : 'Update Addresses'}
                </button>
            </form>
        </div>
    );
}

export default Settings;
