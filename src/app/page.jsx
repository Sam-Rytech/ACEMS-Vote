'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import contractArtifact from '../abi/VotingPool.json'

const CONTRACT_ADDRESS = '0x9ec3c33f8cc9721a91716d846fbf766abac62e6e'

export default function Home() {
  const [wallet, setWallet] = useState('')
  const [contract, setContract] = useState(null)
  const [proposal, setProposal] = useState('')
  const [proposals, setProposals] = useState([])

  const connectWallet = async () => {
    if (window.ethereum) {
      const [account] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      setWallet(account)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const instance = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractArtifact.abi,
        signer
      )

      setContract(instance)
    } else {
      alert('Please install MetaMask!')
    }
  }

  const createProposal = async () => {
    if (!proposal || !contract) return
    try {
      const tx = await contract.createProposal(proposal)
      await tx.wait()
      alert('Proposal Created!')
      setProposal('')
      fetchProposals()
    } catch (error) {
      console.error(error)
    }
  }

  const fetchProposals = async () => {
    try {
      const count = await contract.proposalCount()
      const list = []
      for (let i = 1; i <= Number(count); i++) {
        const [description, voteCount, isPaused, isDeleted] =
          await contract.getProposal(i)
        list.push({
          id: i,
          description,
          voteCount: voteCount.toString(),
          isPaused,
          isDeleted,
        })
      }
      setProposals(list)
    } catch (error) {
      console.error(error)
    }
  }

  const vote = async (id) => {
    try {
      const tx = await contract.vote(id)
      await tx.wait()
      alert('Vote Submitted!')
      fetchProposals()
    } catch (error) {
      console.error(error)
    }
  }

  const pauseProposal = async (id) => {
    try {
      const tx = await contract.pauseProposal(id)
      await tx.wait()
      fetchProposals()
    } catch (err) {
      console.error(err)
    }
  }

  const unpauseProposal = async (id) => {
    try {
      const tx = await contract.unpauseProposal(id)
      await tx.wait()
      fetchProposals()
    } catch (err) {
      console.error(err)
    }
  }

  const deleteProposal = async (id) => {
    try {
      const tx = await contract.deleteProposal(id)
      await tx.wait()
      fetchProposals()
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (contract) fetchProposals()
  }, [contract])

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voting DApp</h1>

      {!wallet ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <p className="mb-2">Connected: {wallet}</p>

          <div className="my-4">
            <input
              type="text"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Enter proposal description"
              className="border p-2 w-full"
            />
            <button
              onClick={createProposal}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Proposal
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Proposals</h2>
            {proposals.length === 0 ? (
              <p>No proposals yet.</p>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className="border p-4 my-2 rounded space-y-2">
                  <p>
                    <strong>ID:</strong> {p.id}
                  </p>
                  <p>
                    <strong>Description:</strong> {p.description}
                  </p>
                  <p>
                    <strong>Votes:</strong> {p.voteCount}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {p.isDeleted
                      ? 'Deleted ❌'
                      : p.isPaused
                      ? 'Paused ⏸️'
                      : 'Active ✅'}
                  </p>

                  {!p.isDeleted && !p.isPaused && (
                    <button
                      onClick={() => vote(p.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded mr-2"
                    >
                      Vote
                    </button>
                  )}

                  {!p.isDeleted && p.isPaused ? (
                    <button
                      onClick={() => unpauseProposal(p.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                    >
                      Unpause
                    </button>
                  ) : !p.isDeleted ? (
                    <button
                      onClick={() => pauseProposal(p.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                    >
                      Pause
                    </button>
                  ) : null}

                  {!p.isDeleted && (
                    <button
                      onClick={() => deleteProposal(p.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  )
}
