"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import BettingManagerContractData from "~~/public/BettingManagerContract.json";

const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const ContractABI = BettingManagerContractData.abi;

const BettingPage: NextPage = () => {
  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [bettingContract, setBettingContract] = useState<ethers.Contract | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchOutcome, setMatchOutcome] = useState(true); // true for win, false for lose

  useEffect(() => {
    if (walletClient) {
      const provider = new ethers.providers.Web3Provider(walletClient as unknown as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ContractABI, signer);
      setBettingContract(contractInstance);
    }
  }, [walletClient]);

  const loadMatches = async () => {
    if (!bettingContract) return;

    const totalMatches = await bettingContract.totalMatches();
    const matchesArray = [];

    for (let i = 0; i < totalMatches; i++) {
      try {
        const match = await bettingContract.matches(i);
        matchesArray.push({
          id: i,
          title: match.title,
          startTimestamp: match.startTimestamp.toString(),
          endTimestamp: match.endTimestamp.toString(),
          isActive: match.isActive,
        });
      } catch (error) {
        console.error(`Error fetching match ${i}:`, error);
      }
    }

    setMatches(matchesArray);
  };

  const createMatch = async () => {
    if (!bettingContract) {
      console.error("Betting contract not initialized");
      return;
    }

    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 3600; // Match lasts for 1 hour

    try {
      const transaction = await bettingContract.createMatch(newMatchTitle, startTime, endTime, { gasLimit: 500000 });
      await transaction.wait();
      alert("Match created successfully!");
      setNewMatchTitle("");
      loadMatches(); // Reload matches after creating a new one
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const placeBet = async (matchId: number) => {
    if (!bettingContract) {
      console.error("Betting contract not initialized");
      return;
    }

    try {
      const transaction = await bettingContract.placeBet(matchId, matchOutcome, {
        value: ethers.utils.parseEther(betAmount),
        gasLimit: 500000,
      });
      await transaction.wait();
      alert("Bet placed successfully!");
      setBetAmount("");
      loadMatches(); // Reload matches after placing a bet
    } catch (error) {
      console.error("Error placing bet:", error);
    }
  };

  const declareMatchResult = async (matchId: number) => {
    if (!bettingContract) {
      console.error("Betting contract not initialized");
      return;
    }

    try {
      const transaction = await bettingContract.declareMatchResult(matchId, matchOutcome, { gasLimit: 500000 });
      await transaction.wait();
      alert("Match result declared successfully!");
      loadMatches(); // Reload matches after declaring result
    } catch (error) {
      console.error("Error declaring match result:", error);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10 bg-gray-100 min-h-screen">
      <div className="px-5">
        <h1 className="text-center text-3xl font-bold mb-4 text-blue-600">Welcome to the Betting System</h1>
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-4">
          <p className="my-2 font-medium">Connected Address:</p>
          <Address address={userAddress} />
        </div>
      </div>
      <div className="matches-list w-full max-w-md mx-auto mb-6">
        <h2 className="text-xl font-semibold mb-2">Existing Matches</h2>
        {matches.length === 0 && <p>No matches available.</p>}
        {matches.map(match => (
          <div key={match.id} className="match border rounded-lg shadow-md p-4 mb-2 bg-white">
            <p>
              <strong>Title:</strong> {match.title}
            </p>
            <p>
              <strong>Start Time:</strong> {new Date(parseInt(match.startTimestamp) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>End Time:</strong> {new Date(parseInt(match.endTimestamp) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Status:</strong> {match.isActive ? "Active" : "Inactive"}
            </p>
            {match.isActive && (
              <div className="flex space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Bet Amount (ETH)"
                  className="input border rounded p-2"
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                />
                <select className="input border rounded p-2" onChange={e => setMatchOutcome(e.target.value === "true")}>
                  <option value="true">Win</option>
                  <option value="false">Lose</option>
                </select>
                <button
                  className="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                  onClick={() => placeBet(match.id)}
                >
                  Place Bet
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start bg-base-300 w-full mt-4 px-8 py-12 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Create New Match</h2>
        <input
          type="text"
          placeholder="Match Title"
          className="input mb-2 border rounded p-2 w-full"
          value={newMatchTitle}
          onChange={e => setNewMatchTitle(e.target.value)}
        />
        <button
          className="btn btn-primary my-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={createMatch}
        >
          Create Match
        </button>
      </div>
      <div className="flex flex-col items-start bg-base-300 w-full mt-4 px-8 py-12 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Declare Match Result</h2>
        <input
          type="number"
          placeholder="Match ID"
          className="input mb-2 border rounded p-2 w-full"
          onChange={e => setSelectedMatchId(parseInt(e.target.value))}
        />
        <select className="input mb-2 border rounded p-2" onChange={e => setMatchOutcome(e.target.value === "true")}>
          <option value="true">Win</option>
          <option value="false">Lose</option>
        </select>
        <button
          className="btn btn-primary my-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => selectedMatchId !== null && declareMatchResult(selectedMatchId)}
        >
          Declare Result
        </button>
      </div>
    </div>
  );
};

export default BettingPage;
