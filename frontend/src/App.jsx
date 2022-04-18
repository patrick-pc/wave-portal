import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import abi from './utils/WavePortal.json';
import './App.css';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [waveCount, setWaveCount] = useState(0);
	const [allWaves, setAllWaves] = useState([]);
	const [message, setMessage] = useState('');
	const [isMining, setIsMining] = useState(false);
	const contractAddress = '0x59f111a9151Ed9b8b0cb255fa19a59B277C36B3a';
	const contractABI = abi.abi;

	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log('Make sure you have metamask!');
				return;
			} else {
				console.log('We have the ethereum object', ethereum);
			}

			const accounts = await ethereum.request({ method: 'eth_accounts' });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log('Found an authorized account:', account);
				setCurrentAccount(account);
				getWaveCount();
				getAllWaves();
			} else {
				console.log('No authorized account found');
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts'
			});

			console.log('Connected', accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				let count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());

				/*
        * Execute the actual wave from your smart contract
        */
				console.log('Message:', message);
				const waveTxn = await wavePortalContract.wave(message, {
					gasLimit: 300000
				});
				setIsMining(true);
				console.log('Mining...', waveTxn.hash);

				await waveTxn.wait();
				console.log('Mined -- ', waveTxn.hash);

				count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());
				getWaveCount();
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
      alert(error);
		}
    setMessage('');
    setIsMining(false);
	};

	const getWaveCount = async () => {
    const { ethereum } = window;
    
		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		const wavePortalContract = new ethers.Contract(
			contractAddress,
			contractABI,
			signer
		);

		let count = await wavePortalContract.getTotalWaves();
		setWaveCount(count.toNumber());
	};

	const getAllWaves = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				const waves = await wavePortalContract.getAllWaves();

				let wavesCleaned = [];
				waves.forEach(wave => {
					wavesCleaned.push({
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 100),
						message: wave.message
					});
				});

				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(
		() => {
			checkIfWalletIsConnected();

			let wavePortalContract;

			const onNewWave = (from, timestamp, message) => {
				console.log('NewWave', from, timestamp, message);
				setAllWaves(prevState => [
					...prevState,
					{
						address: from,
						timestamp: new Date(timestamp * 1000),
						message: message
					}
				]);
			};
      
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();

				wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);
				wavePortalContract.on('NewWave', onNewWave);
			}

			return () => {
				if (wavePortalContract) {
					wavePortalContract.off('NewWave', onNewWave);
				}
			};
		},
		[currentAccount, waveCount]
	);

	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<div className="header">👋 Hey there!</div>

				<div className="bio">
					I am web3slinger! An NFT degen and currently learning solidity.
					Connect your Ethereum wallet and wave at me! You might get some free
					eth. 😉😉😉
				</div>

				{!currentAccount ? (
					<button className="waveButton" onClick={connectWallet}>
						Connect Wallet
					</button>
				) : (
					<>
						<form>
							<input
								type="text"
								placeholder="Message"
								value={message}
								onChange={e => setMessage(e.target.value)}
							/>
						</form>
						<button className="waveButton" onClick={wave} disabled={isMining}>
							{isMining ? 'Mining...' : 'Wave at Me'}
						</button>
					</>
				)}

				{allWaves.length === 0 ? '' : <h2>Wave count: {waveCount}</h2>}
				{allWaves.map((wave, index) => {
					return (
						<div
							key={index}
							style={{
								backgroundColor: 'OldLace',
								marginTop: '16px',
								padding: '8px'
							}}
						>
							<div>Address: {wave.address}</div>
							<div>Time: {wave.timestamp.toString()}</div>
							<div>Message: {wave.message}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default App;
