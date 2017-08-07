# very-simple-wallet
A very simple Ethereum wallet is a simple ethereum distributed app (dapp). The dapp consists of two contracts, written in Solidity and an AngularJS frontend. 

In order to use the live app, you will have to connect to the mainnet, the central Ethereum blockchain. The easiest way to do ths is via MetaMask, a chrome plugin that exposes the web3 object and allows you access to ethereum accounts. As an alternative, you can also use Mist.

1. Clone the repository

2. Use `npm` or `yarn` to install all dependencies 

3. Install truffle

4. Run `truffle compile` to compile the Solidity contracts and create JavaScript interfaces

5. Run `webpack` to build the project in the distribution folder. As an alternative, `npm run dev` to build and serve on your local computer.

6. Run `truffle migrate` to deploy the contract to the blockchain
7. To deploy, start geth with the following `truffle migrate --network live --verbose-rpc`


geth --fast --cache=1024 --rpc --rpcport 9001

web3.personal.unlockAccount(web3.personal.listAccounts[0], "teirrah1963", 15000)

INFO [08-05|14:41:48] Submitted contract creation              fullhash=0x40fccd1b4340a548ba27788e824f6abdb26f5945c3087c9b9b073011bca0f29b contract=0xede99e62feb446a09862193a1b40a9c513bb5f43

To deploy, you'll first have to unlock your ethereum account. In geth, 
web3.personal.unlockAccount(web3.personal.listAccounts[0], "password", 15000). Normally, accounts stay unlocked for a very short window (30 sec). By running this command, you can keep your account unlcoekd for a longer period of time, which might be helpful if you are experimenting.

Deploing your contract can be tricky.I  recommend using a fied defaul gas limit and price. The price I used was based on the price provided by Ethereum Wallet for another transaction. The limit was based on my balance in my account. If you deploy, 

Using the Very Simple Ether Wallet is straightforward. There are three pages: Account, Deposits/Withdrawals and About (which is self-explanatory). Account simply lists all of the transactions that have take place in the contract. It is updated whenever a Deposit or Withdrawal event fires. The Deposits/Withdrawals page allows users to add and remove funds from the account. Instead of allowing users to move an arbitrary amount of ether, users can choose any of the small available sums. In addition, the wallet features three demo accounts which users can interact with. 


