import React, { useState } from 'react';
import { ethers } from 'ethers';
import CupidRegistryABI from './CupidRegistry.json';

function RegisterCupidID({ provider, onSuccess }) {
    const [cupidId, setCupidId] = useState('');
    const [ethAddress, setEthAddress] = useState('');
    const [polyAddress, setPolyAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function checkIdExists(registry, id) {
        // Query for IDRegistered events with the given ID
        const filter = registry.filters.IDRegistered();
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10000 blocks
        const events = await registry.queryFilter(filter, fromBlock, 'latest');

        // Check if any event has the same ID
        return events.some(event => event.args.id === id);
    }

    async function registerID(e) {
        e.preventDefault();
        if (!provider) {
            setError('Please connect MetaMask first');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const signer = provider.getSigner();
            const registryAddress = "0x28ae9184FE0dB8043c46BABA7B0F5537Ef006936";
            const registry = new ethers.Contract(registryAddress, CupidRegistryABI.abi, signer);

            // Validate CUPID ID format
            if (!cupidId.match(/^@[a-zA-Z0-9_]+@cupid$/)) {
                throw new Error('Invalid CUPID ID format. Must be like @username@cupid');
            }

            // Check if ID already exists
            const exists = await checkIdExists(registry, cupidId);
            if (exists) {
                throw new Error('This CUPID ID is already registered');
            }

            // Validate addresses
            if (!ethers.utils.isAddress(ethAddress) || !ethers.utils.isAddress(polyAddress)) {
                throw new Error('Invalid Ethereum or Polygon address');
            }

            // Register the ID
            const tx = await registry.registerID(cupidId, ethAddress, polyAddress);
            setLoading(true);
            await tx.wait();

            // Clear form and notify success
            setCupidId('');
            setEthAddress('');
            setPolyAddress('');
            if (onSuccess) onSuccess();
            alert('CUPID ID registered successfully!');
        } catch (err) {
            console.error(err);
            // Convert error object to string message
            const errorMessage = typeof err === 'string' ? err : err?.message || err?.reason || JSON.stringify(err) || 'Failed to register CUPID ID';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ marginTop: 32, maxWidth: 500 }}>
            <h3>Register CUPID ID</h3>
            {error && (
                <div style={{ color: 'red', marginBottom: 16 }}>
                    Error: {error}
                </div>
            )}
            <form onSubmit={registerID}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                        CUPID ID (e.g., @alice@cupid)
                        <input
                            value={cupidId}
                            onChange={(e) => setCupidId(e.target.value)}
                            placeholder="@username@cupid"
                            required
                            style={{ display: 'block', width: '100%', marginTop: 4, padding: 8 }}
                            disabled={loading}
                        />
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
                            disabled={loading}
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
                            disabled={loading}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading || !cupidId || !ethAddress || !polyAddress}
                    style={{ padding: '8px 16px' }}
                >
                    {loading ? 'Registering...' : 'Register ID'}
                </button>
            </form>
        </div>
    );
}

export default RegisterCupidID;
