import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CupidRegistryABI from './CupidRegistry.json';

function RegisteredIDs({ provider }) {
    const [registeredIds, setRegisteredIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchRegisteredIds() {
            if (!provider) return;

            try {
                // Request account access first
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                const registryAddress = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936";
                const registry = new ethers.Contract(registryAddress, CupidRegistryABI.abi, provider);

                // Get the last block number
                const currentBlock = await provider.getBlockNumber();
                // Look back 10000 blocks or to contract deployment
                const fromBlock = Math.max(0, currentBlock - 10000);

                // Get all IDRegistered events
                const filter = registry.filters.IDRegistered();
                const events = await registry.queryFilter(filter, fromBlock, "latest");

                // Process and deduplicate events (keep latest registration for each ID)
                const idMap = new Map();
                events.forEach(event => {
                    try {
                        if (event && event.args) {
                            const id = event.args.id?.toString();
                            const ethereum = event.args.ethereum?.toString();
                            const polygon = event.args.polygon?.toString();

                            if (id && ethereum && polygon) {
                                idMap.set(id, {
                                    id,
                                    ethereum,
                                    polygon,
                                    blockNumber: event.blockNumber
                                });
                            }
                        }
                    } catch (err) {
                        console.error('Error processing event:', err);
                    }
                });

                // Convert map to array and sort by block number (most recent first)
                const ids = Array.from(idMap.values())
                    .filter(id => id && typeof id.id === 'string')
                    .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));

                setRegisteredIds(ids);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching registered IDs:', err);
                setError('Failed to load registered IDs');
                setLoading(false);
            }
        }

        fetchRegisteredIds();
    }, [provider]);

    if (loading) return <div>Loading registered IDs...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (registeredIds.length === 0) return <div>No registered IDs found</div>;

    const refreshIds = () => {
        setLoading(true);
        setError(null);
        fetchRegisteredIds();
    };

    return (
        <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Registered CUPID IDs</h3>
                <button
                    onClick={refreshIds}
                    disabled={loading}
                    style={{ padding: '4px 8px' }}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '8px'
            }}>
                {registeredIds.map((reg) => (
                    <div key={reg.id} style={{
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        fontSize: '14px'
                    }}>
                        <div><strong>{reg.id}</strong></div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                            ETH: {reg.ethereum.substring(0, 6)}...{reg.ethereum.substring(38)}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                            Polygon: {reg.polygon.substring(0, 6)}...{reg.polygon.substring(38)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RegisteredIDs;
