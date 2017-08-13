var app = angular.module('myDapp', ['ngRoute']);


app.service('simplewallet', function($rootScope, $http) {

    var self = this;

    // Loading status (reflected on index controller)
    self.status = {
        loading: true,
        error: false,
        message: 'Connecting to dApp. Please confirm that MetaMask or Mist is properly configured.',
        web3: true
    }

    // Store simple wallet totals
    self.balance = {
        wei: 0,
        ether: 0,
        usd: 0
    }

    self.deposits = {
        wei: 0,
        ether: 0,
        usd: 0
    }

    self.withdrawals = {
        wei: 0,
        ether: 0,
        usd: 0
    }

    // Status updates for deposit/withdrawal forms
    self.transfer = {
        deposit: {
            error: false,
            success: false,
            message: ''
        },
        withdrawal: {
            error: false,
            success: false,
            message: ''
        },
    }

    // Object store contract address
    self.address = {};

    // Hash table of mined transactions 
    // (deposit and withdrawal events triggered)
    self.transferMap = {};

    // Hash table mapping transaction hashes to transaction ids
    self.transferId = 0;
    self.transactionHashToId = {};
 
    // Create list for demo accounts
    self.demoAccounts = [];
    let demoNames = ['A', 'B', 'C'];
    for (let i = 0; i < 3; i++) {
        self.demoAccounts.push({
            address: null,
            wei: null,
            name: 'Account ' + demoNames[i] 
        });
    }


    /******************************************/
    /* Utility Methods
    /******************************************/


    // Create a promise from async web3 method
    var web3Promise = self.web3Promise = function(web3_async, param) {

        // Return a new promise
        return new Promise(function(resolve, reject) {
            
            var callback = function(error, result) {
                if (error) { return reject(error); }
                return resolve(result);
            };

            if (!param) {
                web3_async(callback);
            } else {
                web3_async(param, callback);
            }
        });
    };

    // Simple wallet event handler
    function allEventsCallback(error, result) {

        // Transform amount to ether
        result.value = {}
        result.gas = {}

        /*
            Small corner case--transaction below is both deposit and withdrawal. Functionality disabled going forward.
        if (result.transactionHash == '0xb4ec00040aab8e021aaf94b0a99d1a7eb3a158f64c9b1d5098071d36e2645c02') {
            console.log(result);
        }
        */
        
        var transaction;

        // Instantiate promise derived from async web3 methods
        web3Promise(web3.eth.getTransactionReceipt, result.transactionHash) 
        // Use transaction to get gas used
        .then(function (receipt) {   
            transaction = receipt;
            result.gas.used = transaction.gasUsed;  

            // Convert gas to BigNumber
            result.gas.usedBig = web3.toBigNumber(result.gas.used);
            // Get gas price
            return web3Promise(web3.eth.getGasPrice, null);
        })
        // Use transaction to get block
        .then(function(price) {
            result.gas.price = price;
            result.gas.wei = result.gas.usedBig.times(result.gas.price);            
            convertToEthUsd(result.gas);
            return web3Promise(web3.eth.getBlock, transaction.blockHash);
        })
        // Get price of gas
        // Use block to get timestamp
        .then(function success(block) {

            // Transform amount to ether
            result.value.wei = result.args.amount
            convertToEthUsd(result.value);

            // Update transfer with sign
            if (result.event == 'DepositEvent') {
                result.sign = '+';
                result.to_from = result.args._sender;
                result.type = 'deposit';

                self.transfer.deposit.processing = false;
                self.transfer.deposit.message = '';
            } else if (result.event == 'WithdrawalEvent') {
                result.to_from = result.args.recipient;
                result.sign = '—';
                result.type = 'withdrawal';

                self.transfer.withdrawal.processing = false;
                self.transfer.withdrawal.message = '';
            }

            // Update status of transaction
            result.mined = true;
            result.pending = false;
            
            let hash = transaction.transactionHash;

            // If transaction is not in transfer map (not pending)
            if (!self.transactionHashToId.hasOwnProperty(hash)) {
                // Add a time
                result.timestamp = block.timestamp;
                result.time = new Date(result.timestamp * 1000);

                // Map id to transaction
                self.transactionHashToId[hash] = self.transferId;

                // Add transaction to transfer map
                self.transferMap[self.transferId] = result;

                // Increment transfer map
                self.transferId++;
            } else {
                // Get the id 
                let id = self.transactionHashToId[hash];

                // Update transfer object
                let transfer = self.transferMap[id];

                // Transaction is both deposit and withdrawal
                if (transfer.mined) {
                    delete self.transferMap[id];
                    return;
                }
                transfer.mined = result.mined;
                transfer.pending = result.pending;
                transfer.blockNumber = result.blockNumber;
                transfer.gas = result.gas;
            }
        })
        // Update balances of demo accounts
        .then(function() {
            return updateDemoBalances();
        })
        // Update wallet balance and deposit/withdraw summary
        .then(function() {
            updateDepositWithdraw();
            return updateWalletBalance();
        })
        // Update scope
        .then(function() {
            $rootScope.$apply();
        })
        // Catch errors
        .catch(function(error) {
            self.error = true;
            console.error(error);
        });

    }

    // Convert from wei to ether and dollars (and attach function to scope)
    var convertToEthUsd = self.convertToEthUsd = function(valueObj) {
        valueObj.ether = web3.fromWei(valueObj.wei, 'ether').toNumber();
        valueObj.usd = valueObj.ether * self.currency.USD;
    }

    // Update deposit and withdrawal totals
    function updateDepositWithdraw() {

        self.deposits.wei = web3.toBigNumber(0);
        self.withdrawals.wei = web3.toBigNumber(0);

        for (id in self.transferMap) {
            let transfer = self.transferMap[id];

            if (transfer.type === 'deposit') {
                self.deposits.wei = self.deposits.wei.add(transfer.value.wei);
            }

            if (transfer.type === 'withdrawal') {
                self.withdrawals.wei = self.withdrawals.wei.add(transfer.value.wei);
            }
        }
        convertToEthUsd(self.deposits);
        convertToEthUsd(self.withdrawals);
    }

    // Returns a promise that resovles when all demo accounts have been updated
    function updateDemoBalances() {

        // Create array of promises to retrieve demo balances
        let demoBalances = []
        for (var i = 0; i < 3; i++) {
            demoBalances.push(contract.getDemoAccountBalance.call(i));
        }   
        
        // Handle list of promises
        return Promise.all(demoBalances)
            .then(function(balances) {
                for (let i = 0; i < 3; i++) {
                    self.demoAccounts[i].wei = balances[i];
                    convertToEthUsd(self.demoAccounts[i]);
                }
            })

    }

    // Returns promise which resolves when wallet balance is updated
    function updateWalletBalance() {

        return web3Promise(web3.eth.getBalance, self.contract.address)
            // Get simple wallet deposits total
            .then(function(total) {
                self.balance.wei = total;
                convertToEthUsd(self.balance);
                $rootScope.$apply();
                return Promise.resolve(1);
            })
            .catch(function(error){
                console.error(error);
                self.error = true;
            })
    }

    
    /******************************************
     * Currency Promise
     ******************************************/

    let url = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR'
    self.currency = {};
    
    // Simple GET request example:
    let currencyPromise = $http({
        method: 'GET',
        url: url
    }).then(function successCallback(response) {
        self.currency.BTC = response.data.BTC;
        self.currency.USD = response.data.USD;
        self.currency.EUR = response.data.EUR;
    }, function errorCallback(response) {
        console.error(response);
    });

    /******************************************
     * Promise Chain (set up Simple Wallet app, resolve various callbacks)
     ******************************************/
    
    self.user = {};

    var contract;
    // Get the contract
    self.loaded = window.SimpleWallet.deployed().then(function(instance) {
        contract = self.contract = instance;
        
        self.status.message = 'Aquiring accounts. Please confirm that MetaMask and Mist are properly configured.';
        $rootScope.$apply();
        return web3Promise(web3.eth.getAccounts);
    })

    // Get user's accounts, attach to simple wallet
    .then(function(accounts) {
        self.user.accounts = accounts;

        // Resolve currency promise
        self.status.message = 'Aquiring current Ether and USD prices.'; 
        $rootScope.$apply();       
        return currencyPromise;
    })

    // Get demo account addresses
    .then(function() {
        let demoAddresses = [];
        for (var i = 0; i < 3; i++) {
            demoAddresses.push(contract.getDemoAccountAddress.call(i));
        }   

        // Resolve demo account addresses
        self.status.message = 'Updating demo accounts.';
        $rootScope.$apply();
        return Promise.all(demoAddresses);
    })

    // Process demo account addresses
    .then(function(result) {
        for (let i = 0; i < 3; i++) {
            self.demoAccounts[i].address = result[i];
        }

        // Get demo account balances
        self.status.message = 'Updating demo accounts'; 
        $rootScope.$apply();       
        return updateDemoBalances();        
    })

    // Get smart wallet balance
    .then(function() {

        self.status.message = 'Updating wallet balance.';
        $rootScope.$apply();
        return updateWalletBalance();
    })    

    // Start event listener
    .then(function() {

        self.status.loading = false;
        self.status.message = '';

        self.events = contract.allEvents({
            fromBlock: 0, 
            toBlock: 'latest', }, 
        allEventsCallback);        

        $rootScope.$apply();
        return Promise.resolve();
    })

    // Catch errors
    .catch(function(error) {
        self.status.message = 'An error occured. Please check console and reload page.';
        self.status.error = true;
        console.log(error);
        $rootScope.$apply();
    })

})

app.controller("mainController", function($scope, simplewallet) {

    // Hash tables storing mined and pending transactions
    $scope.transferMap = simplewallet.transferMap;
    $scope.transferList = [];

    // When an event is triggered
    $scope.$watch('transferMap', function() {
        updateTransferList();
    }, true);

    // Move transactions in map to array
    function updateTransferList() {
        $scope.transferList = [];
        for (id in $scope.transferMap) {
            let transfer = $scope.transferMap[id];
            $scope.transferList.push(transfer);
        }
    }

    // Set up dummy value for contract address
    $scope.contract = {
        address: null,
    };

    // Update address if simple wallet contract has loaded
    simplewallet.loaded.then(function() {
        $scope.contract = simplewallet.contract;
        $scope.$apply();
    });

    // Get balance, deposits and withdrawal totals from simplewallet
    $scope.balance = simplewallet.balance;
    $scope.deposits = simplewallet.deposits;
    $scope.withdrawals = simplewallet.withdrawals;

    // Update CSS based on sign of funds
    $scope.getSignCSS = function(sign) {
        var css;
        if (sign === '—') {
            css = 'negative';
        } else if (sign === '+') {
            css = 'positive';
        }
        return css;
    }

    // Create URLs from transactions
    $scope.getTransactionUrl = function(tx) {
        var url = 'https://etherscan.io/tx/'
        return url + tx;
    }

    $scope.getAddressUrl = function(address) {
        var url = 'https://etherscan.io/address/'
        return url + address;
    }

    $scope.getBlockUrl = function(block) {
        var url = 'https://etherscan.io/block/'
        return url + block;
    }
    
});

app.controller('indexController', function($scope, simplewallet) {

    // $scope.loading = simplewallet.loading;
    $scope.status = simplewallet.status;

    // Get currency from Simple Wallet for navbar
    simplewallet.loaded.then(function() {
        $scope.currency = simplewallet.currency;
    });

    // Hide loading screen
    $scope.hideLoadingScreen = function () {
        return $scope.status.web3 && !$scope.status.loading;
    }

    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.info("Using web3 detected from external source.")

        $scope.status.web3 = true;
        // Use MetaMask's provider
        window.web3 = new Web3(web3.currentProvider);
    } else {
        // Get web3 from Mist
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

        if (typeof web3 !== 'undefined') {
            $scope.status.web3 = false;
            console.warn("No web3 detected. Please consider using Ethereum browser Mist or MetaMask");
        }
    }

    // Reload button
    $scope.reload = function() {
        window.location.reload();
    }

});


app.controller('aboutController', function($scope) {});


app.controller("transactController", function($scope, $rootScope, simplewallet) {
 
    // Update model when Simple Wallet promise chain resolves
    var contract;
    var currency;
    var demoAccounts; 
    var convertToEthUsd;
    simplewallet.loaded.then(function() {

        contract = simplewallet.contract;
        currency = simplewallet.currency;
        demoAccounts = $scope.demoAccounts = simplewallet.demoAccounts;
        convertToEthUsd = simplewallet.convertToEthUsd;

        $scope.addressFrom = {
            demo: demoAccounts[0],
            user: null,
        }

        $scope.addressTo = {
            demo: demoAccounts[0],
            user: null,
        }
        
        $scope.pendingMap = simplewallet.pendingMap;
        $scope.$apply();
    });

    var web3Promise = simplewallet.web3Promise;
    // Check that Ether accounts are available, retrieve otherwise
    var checkAccounts = function() {
        
        return new Promise(function(resolve, reject) {
            if (!simplewallet.user.accounts) {
                return web3Promise(web3.eth.getAccounts);
            }
            else {
                resolve(simplewallet.user.accounts);
            }
        })
    }

    $scope.transferMap = simplewallet.transferMap;
    var createTransactionPlaceholder = function(amount, address, type) {

        // Get ether and usd conversions
        let value = { wei: web3.toBigNumber(amount) }
        convertToEthUsd(value);

        let id = simplewallet.transferId;

        // Add transaction to transfer map
        $scope.transferMap[id] = {
            transactionHash: '',
            mined: false,
            pending: true,
            type: type,
            timestamp: Date.now(),
            time: new Date(),
            to_from: address,
            value: value
        }

        if (type == 'deposit') {
            $scope.transferMap[id].sign = '+';
        } else if (type === 'withdrawal') {
            $scope.transferMap[id].sign = '—';
        }

        // Increment transfer id
        simplewallet.transferId++;
        return id;
    }
        
    

    /******************************************
     * Deposit Methods
     ******************************************/

    // Attach transfer messages to simple wallet
    $scope.transfer = simplewallet.transfer;

    function depositFromDemo(amount, index, address) {

        // Check that deposit is possible
        let zero = web3.toBigNumber(0);
        if (demoAccounts[index].wei.equals(zero)) {
            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = false;
            $scope.transfer.deposit.message = "Cannot transfer funds from empty account.";
            return;
        }

        if (demoAccounts[index].wei.lessThan(amount)) { 
            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = false;
            $scope.transfer.deposit.message = "Funds are insufficient to complete this deposit.";
            return;
        };

        // Create transaction placeholder
        let transferId = createTransactionPlaceholder(amount, address, 'deposit');

        // Check for Ether account and then invoke contract method
        checkAccounts().then(function(accounts) {
            simplewallet.user.accounts = accounts;
            
            return contract.transferFromDemo(amount, index, {
                // Sign transaction with first available account
                from: simplewallet.user.accounts[0],
            })
        
        }).then(function(res) {

            // Update transaction hash in transfer map
            $scope.transferMap[transferId].transactionHash = res.tx;

            // Map transaction hash to transfer id
            simplewallet.transactionHashToId[res.tx] = transferId;

            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = true;
            $scope.transfer.deposit.message = "Deposit initiated. Please check Account page for status.";

            $rootScope.$apply();
        }).catch(function(error) {

            // Remove dummy transaction from pending map
            delete $scope.transferMap[transferId];

            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = false;
            $scope.transfer.deposit.message = "Deposit failed. Please see console for more details. \
                                               Confirm that originating account has enough funds before attempting a transfer.";
            console.error(error.stack);
            $rootScope.$apply();
        })
    }


    // Set up deposit
    $scope.depositFunds = function(amount) {  
        
        $scope.transfer.deposit.message = '';
        $scope.transfer.withdrawal.message = '';
        $scope.transfer.deposit.processing = true;

        amount /= currency.USD;
        amount = Math.floor(web3.toWei(amount, "ether"));
    
        // Get address of demo account
        var index;
        var account = $scope.addressFrom.demo;
        for (var i = 0; i < 3; i++) {
            if ($scope.addressFrom.demo.name == demoAccounts[i].name) {
                index = i;
                break;
            }
        }
        var address = demoAccounts[i].address; 
        depositFromDemo(amount, index, address);
    }

    /******************************************
     * Withdrawal Methods
     ******************************************/

    // Execute withdrawawl
    function withdrawToAddress(amount, address) {

        // Create transaction placeholder
        let transferId = createTransactionPlaceholder(amount, address, 'withdrawal');

        // Check that deposit is possible
        if (address === contract.address) {
            $scope.transfer.withdrawal.processing = false;
            $scope.transfer.withdrawal.success = false;
            $scope.transfer.withdrawal.message = "Wallet cannot withdraw into itself.";
            return;
        }

        contract.transferToAddress(amount, address, {
                from: simplewallet.user.accounts[0],
            }).then(function success(res) {

                // Update transaction hash in transfer map
                $scope.transferMap[transferId].transactionHash = res.tx;
            
                // Map transaction hash to transfer id
                simplewallet.transactionHashToId[res.tx] = transferId;

                $scope.transfer.withdrawal.processing = false;
                $scope.transfer.withdrawal.success = true;
                $scope.transfer.withdrawal.message = "Withdrawal initiated. Please check Account page for status.";

                // Force update on all views (main in particular)
                $rootScope.$apply();

            }, function failure(error) {

                // Remove dummy transaction from pending map
                delete $scope.transferMap[transferId];

                $scope.transfer.withdrawal.processing = false;
                $scope.transfer.withdrawal.success = false;
                $scope.transfer.withdrawal.message = "Withdrawal failed. Please see console for more details. \
                                                      Confirm that Simple Wallet has enough funds before attempting a transfer.";
                console.error(error.stack);
                $rootScope.$apply();
            });
    };

    // Set up withdrawal
    $scope.withdrawFunds = function(amount) {  
        
        $scope.transfer.deposit.message = '';
        $scope.transfer.withdrawal.message = '';
        $scope.transfer.withdrawal.processing = true;
        
        amount /= currency.USD;
        amount = Math.floor(web3.toWei(amount, "ether"));
        var address;
        var i = null;
        if ($scope.addressTo.user) {
            address = $scope.addressTo.user;
        } else {
            for (i = 0; i < 3; i++) {
                if ($scope.addressTo.demo.name == demoAccounts[i].name) {
                    address = demoAccounts[i].address;
                    break;
                }
            }
        }

        withdrawToAddress(amount, address, i);
    }
});

app.config(function($routeProvider) {

    $routeProvider.when('/', {
        templateUrl: 'views/main.html',
        controller: 'mainController'
    }).when('/about', {
        templateUrl: 'views/about.html',
        controller: 'aboutController'
    }).when('/transact', {
        templateUrl: 'views/transact.html',
        controller: 'transactController'
    }).otherwise( { 
        redirects: '/'
    })

});
