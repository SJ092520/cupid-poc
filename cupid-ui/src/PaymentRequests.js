import React from 'react';
import { ethers } from 'ethers';

function PaymentRequests({ provider, receiverId, onSelectRequest }) {
    const [requests, setRequests] = React.useState([]);

    React.useEffect(() => {
        // Load payment requests from localStorage
        const allRequests = JSON.parse(localStorage.getItem('paymentRequests') || '[]');
        // Filter requests for the current user
        const userRequests = allRequests.filter(req =>
            req.fromId === receiverId && req.status === 'pending'
        );
        setRequests(userRequests);
    }, [receiverId]);

    if (requests.length === 0) return null;

    return (
        <div style={{ marginTop: 16 }}>
            <h4>Payment Requests</h4>
            <div style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px'
            }}>
                {requests.map((request, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '8px',
                            borderBottom: index < requests.length - 1 ? '1px solid #eee' : 'none',
                            cursor: 'pointer'
                        }}
                        onClick={() => onSelectRequest(request)}
                    >
                        <div>From: <strong>{request.toId}</strong></div>
                        <div>Amount: <strong>{request.amount} POL</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {new Date(request.timestamp).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PaymentRequests;
