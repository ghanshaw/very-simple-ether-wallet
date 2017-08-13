# very-simple-ether-wallet
The Very Simple Ether Wallet is a simple ethereum distributed app (dapp). The dapp consists of two contracts, written in Solidity with an AngularJS frontend. 

In order to use the live app, you will have to connect to the mainnet, the central Ethereum blockchain. The easiest way to do ths is via MetaMask, a chrome plugin that exposes the web3 object and allows you access to ethereum accounts. As an alternative, you can also use Mist.

### Steps

1. Clone the repository

2. Use `npm` or `yarn` to install all dependencies 

3. Install truffle

4. Run `truffle compile` to compile the Solidity contracts and create JavaScript interfaces

5. Run `webpack` to build the project in the distribution folder. As an alternative, `npm run dev` to build and serve on your local computer.

6. Start geth: `geth --rpc --rpcport 9001`. Be sure to use the your own port settings when running geth. 

7. Unlock the account that you intend to deploy with. You can do this in the geth console: `web3.personal.unlockAccount(web3.personal.listAccounts[0], "password", 15000)`. This command will unlock the account for an extended period of time, which may be useful if you are experimenting.

8. Finally, deploy.

	`truffle migrate --network live --verbose-rpc`.
	
	 You can also run on testrpc with the command
	 
	 `truffle migrate --network development`. 
	 
	 Also, remember to replace the *from* field in the `truffle.js` file with your own ethereum account. Or remove the field to use the default account attached to your instance of web3. 

###How to Use
Using the Very Simple Ether Wallet is straightforward. There are three pages: Account, Deposits/Withdrawals and About (which is self-explanatory). Account simply lists all of the transactions that have taken place in the contract. It is updated whenever a Deposit or Withdrawal event fires. The Deposits/Withdrawals page allows users to add and remove funds from the account. Instead of allowing users to move an arbitrary amount of ether, I limit users to any of the small quantities available. In addition, the wallet features three demo accounts which users can interact with. 

###Tips and Tricks

Deploing your contract can be tricky. I reccommend experimenting with the default gas limit and price. The default gas price in truffle is 100 Gwei, which is probably much higher than you'll need it to be. I would recommend staying within 20 and 30 gwei, but increasing the gas limit past what you anticipate you'll need. 






