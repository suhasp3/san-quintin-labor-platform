import { useState, useEffect } from 'react';
import type { Contract } from '../types';

export default function MyContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:8000/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      } else {
        // Fallback to localStorage if API fails
        const savedContracts = localStorage.getItem('contracts');
        if (savedContracts) {
          setContracts(JSON.parse(savedContracts));
        }
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // Fallback to localStorage
      const savedContracts = localStorage.getItem('contracts');
      if (savedContracts) {
        setContracts(JSON.parse(savedContracts));
      }
    }
  };

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusText = (status: Contract['status']) => {
    switch (status) {
      case 'accepted':
        return 'Accepted ✅';
      case 'rejected':
        return 'Rejected ❌';
      default:
        return 'Pending ⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold">My Contracts</h1>
        <p className="text-sm mt-1 opacity-90">Your application status</p>
      </div>

      <div className="p-4">
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600 mb-2">You don't have any contracts yet</p>
            <p className="text-sm text-gray-500">Apply to jobs to see them here</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-lg shadow-md p-4 mb-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {contract.jobTitle}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                    contract.status
                  )}`}
                >
                  {getStatusText(contract.status)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">💵</span>
                  <span className="font-medium">{contract.pay}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">📍</span>
                  <span>{contract.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>{contract.date}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

