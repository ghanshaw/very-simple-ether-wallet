var app = angular.module('myDapp', ['ngRoute']);


app.service('simplewallet', function($rootScope, $http) {

    var self = this;
    // self.address = SimpleWallet.address;

    // Page status
    self.loading = true;
    self.error = false;

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

    // Object store contract address
    self.address = {};

    // Hash table of mined transactions 
    // (deposit and withdrawal events triggered)
    self.transferMap = {};

    // Hash table of pending transactions
    self.pendingMap = {};

    
    // let demoAddresses = [];
    // let demoBalances = [];

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
    function web3Promise(web3_async, param) {
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

        var transaction;

        // $scope.transferList.push(result);

        // Instantiate promise derived from async web3 methods
        web3Promise(web3.eth.getTransactionReceipt, result.transactionHash) 
        // Use transaction to get gas used
        .then(function (receipt) {   
            transaction = receipt;
            result.gas.used = transaction.gasUsed;  

            // Get gas price
            return web3Promise(web3.eth.getGasPrice, null);
        })
        // Use transaction to get block
        .then(function(price) {
            result.gas.wei = price;
            convertToEthUsd(result.gas)
            return web3Promise(web3.eth.getBlock, transaction.blockHash);
        })
        // Get price of gas
        // Use block to get timestamp
        .then(function success(block) {

            // Transform amount to ether
            
            result.value.wei = result.args.amount
            convertToEthUsd(result.value);

            if (result.event == 'DepositEvent') {
                result.sign = '+';
                result.to_from = result.args._sender;
            } else if (result.event == 'WithdrawalEvent') {
                result.to_from = result.args.recipient;
                result.sign = '—';
            }

            result.timestamp = block.timestamp;
            result.time = new Date(result.timestamp * 1000);

            
            let hash = transaction.transactionHash;
            self.transferMap[hash] = result;
            // Remove from pending map, if there
            if (self.pendingMap.hasOwnProperty(hash)) {
                // delete self.pendingMap[hash];
            }
            $rootScope.$apply();

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
        // Catch errors
        .catch(function(error) {
            self.error = true;
            console.error(error);
        });

    }

    // Convert from wei to ether and dollars (and attach function to scope)
    var convertToEthUsd = self.convertToEthUsd = function(valueObj) {
        valueObj.ether = web3.fromWei(valueObj.wei, 'ether').toNumber();
        // if (typeof valueObj.eth === 'BigNumber') {
        //     valueObj.ether = valueObj.ether.toNumber();
        valueObj.usd = valueObj.ether * self.currency.USD;
    }

    // Update deposit and withdrawal totals
    function updateDepositWithdraw() {

        self.deposits.wei = web3.toBigNumber(0);
        self.withdrawals.wei = web3.toBigNumber(0);

        for (hash in self.transferMap) {
            let transfer = self.transferMap[hash];

            if (transfer.event === 'DepositEvent') {
                self.deposits.wei = self.deposits.wei.add(transfer.value.wei);
            }

            if (transfer.event === 'WithdrawalEvent') {
                self.withdrawals.wei = self.withdrawals.wei.add(transfer.value.wei);
            }
        }
        convertToEthUsd(self.deposits);
        convertToEthUsd(self.withdrawals);

        $rootScope.$apply();
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

                return Promise.resolve(1);
            })
            .catch(function(error){
                console.error(error);
                this.error = true;
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
        console.log('GOT CURRENCIES');
    }, function errorCallback(response) {
        console.error(response);
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });

    /******************************************
     * Promise Chain
     ******************************************/
    
    var contract;
    // Get the contract
    self.loaded = window.SimpleWallet.deployed().then(function(instance) {
        contract = self.contract = instance;
        
        // Resolve currency promise
        return currencyPromise;
    })

    // Get demo account addresses
    .then(function() {
        let demoAddresses = [];
        for (var i = 0; i < 3; i++) {
            demoAddresses.push(contract.getDemoAccountAddress.call(i));
        }   

        // Resolve demo account addresses
        return Promise.all(demoAddresses);
    })

    // Process demo account addresses
    .then(function(result) {
        for (let i = 0; i < 3; i++) {
            self.demoAccounts[i].address = result[i];
        }

        // Get demo account balances
        return updateDemoBalances();        
    })

    // Get smart wallet balance
    .then(function() {
        return updateWalletBalance();
    })    

    // Start event listener
    .then(function() {

        self.loading = false;

        self.events = contract.allEvents({
            fromBlock: 0, 
            toBlock: 'latest', }, 
        allEventsCallback);

        // alert('all done loading');
        $rootScope.$apply();
        return Promise.resolve();
    })

    // Catch errors
    .catch(function(error) {
        console.log(error);
        self.error = true;
    })

})

app.controller("mainController", function($scope, simplewallet) {

    $scope.transferMap = simplewallet.transferMap;
    $scope.pendingMap = simplewallet.pendingMap;

    $scope.transferList = [];
    $scope.pendingList = [];
    

    // When an event is triggered
    $scope.$watch('transferMap', function() {
        console.log('updating table');
        updatePendingList();
        updateTransferList();
    }, true);

    function updateTransferList() {
        $scope.transferList = [];
        for (hash in $scope.transferMap) {
            let transfer = $scope.transferMap[hash];
            $scope.transferList.push(transfer);

            // If this transaction is in the pending map, remove it
            if ($scope.pendingMap.hasOwnProperty(hash)) {
                // delete pendingMap[hash];
            }
        }
    }

    function updatePendingList() {
        $scope.pendingList = [];
        for (hash in $scope.pendingMap) {
            let pending = $scope.pendingMap[hash];
            // convertToEthUsd(pending.value);
            $scope.pendingList.push(pending);
        }
    }



    // Set up dummy value for contract address
    $scope.contract = {
        address: '...',
    };

    // Update address if simple wallet contract has loaded
    simplewallet.loaded.then(function() {
        $scope.contract = simplewallet.contract;
        $scope.$apply();
    });
    $scope.balance = simplewallet.balance;
    $scope.deposits = simplewallet.deposits;
    $scope.withdrawals = simplewallet.withdrawals;

    $scope.getSignCSS = function(sign) {
        var css;
        if (sign === '—') {
            css = 'negative';
        } else if (sign === '+') {
            css = 'positive';
        }
        else {
            css = 'akjsldfasf';
        }

        return css;
    }

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

    $scope.loading = simplewallet.loading;
    $scope.warning = false;

    $scope.hideLoadingScreen = function () {
        console.log($scope.warning);
        return !$scope.warning && !simplewallet.loading;
    }

    window.addEventListener('load', function() {
        // Checking if Web3 has been injected by the browser (Mist/MetaMask)
        if (typeof web3 !== 'undefined') {
            console.info("Using web3 detected from external source.")
            $scope.warning = false;
            // Use Mist/MetaMask's provider
            window.web3 = new Web3(web3.currentProvider);
        } else {
            $scope.warning = true;
            console.warn("No web3 detected. Please consider using Ethereum browser Mist or MetaMask");
        }


        $scope.$apply();
    });

    $scope.reload = function() {
        window.location.reload();
    }

    // alert('alsjdfljas');

});


app.controller('aboutController', function($scope) {

    

});


app.controller("transactController", function($scope, simplewallet) {
 
    
    
    var contract;
    var currency;
    var demoAccounts; 
    var convertToEthUsd
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

        // alert('all done');
        $scope.$apply();

    });

    /******************************************
     * Pagination
     ******************************************/


    
    // $scope.itemsPerPage = 5;
    
    // $scope.filteredItems = [];
    // $scope.groupedItems = [];
    // $scope.itemsPerPage = 5;
    // $scope.pagedItems = [];
    // $scope.currentPage = 0;
    
    // // calculate page in place
    // $scope.groupToPages = function () {
    //     $scope.pagedItems = [];
        
    //     // Build 2D array of pages
    //     for (var i = 0; i < $scope.transferList.length; i++) {

    //         // Beginning of page, create new array
    //         if (i % $scope.itemsPerPage === 0) {
    //             $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.transferList[i] ];
    //         } else {
    //             $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
    //         }
    //     }
    // };

    // // Construct range
    // $scope.range = function (size, start, end) {
    //     var ret = [];        
    //     console.log(size,start, end);
                      
    //     if (size < end) {
    //         end = size;
    //         start = size-$scope.gap;
    //     }
    //     for (var i = start; i < end; i++) {
    //         ret.push(i);
    //     }        
    //      console.log(ret);        
    //     return ret;
    // };

    // $scope.prevPage = function () {
    //     if ($scope.currentPage > 0) {
    //         $scope.currentPage--;
    //     }
    // };


    // $scope.nextPage = function () {
    //     if ($scope.currentPage < $scope.pagedItems.length - 1) {
    //         $scope.currentPage++;
    //     }
    // };
    
    // $scope.setPage = function () {
    //     $scope.currentPage = this.n;
    // };


    /******************************************
     * Deposit Methods
     ******************************************/

    // function depositFromAddress(amount, address) {

    //     web3.eth.sendTransaction(
    //         { 
    //             from: address, 
    //             to: contract.address, 
    //             value: amount
    //         }, function(error, result) {
    //             if (error) {
    //                 $scope.transfer.deposit.success = false;
    //                 $scope.transfer.deposit.error = true;
    //                 $scope.transfer.deposit.message = "Deposit failed. Please see console for more details. \
    //                                                 Confirm that originating account has enough funds before attempting a transfer.";
    //                 console.error(error.stack); 
    //             } else {
    //                 $scope.transfer.deposit.success = true;
    //                 $scope.transfer.deposit.error = false;
    //                 $scope.transfer.deposit.message = "Deposit initiated. Please check Account page for status.";
    //             }
    //             $scope.$apply();
    //         }
    //     );

    // }

    $scope.transfer = {
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

    function depositFromDemo(amount, index, address) {

        // let zero = web3.toBigNumber(0);
        // if (demoAccounts[index].wei.equals(zero)) {
        //     $scope.transfer.deposit.processing = false;
        //     $scope.transfer.deposit.success = false;
        //     $scope.transfer.deposit.message = "Cannot transfer funds from empty account.";
        //     return;
        // }

        // if (demoAccounts[index].wei.lessThan(amount)) { 
        //     $scope.transfer.deposit.processing = false;
        //     $scope.transfer.deposit.success = false;
        //     $scope.transfer.deposit.message = "Funds are insufficient to complete this deposit.";
        //     // console.error(error.stack);
        //     return;
        // };

        contract.transferFromDemo(amount, index, {
                // Sign transaction with first available account
                from: web3.eth.accounts[0],
            }).then(function(res) {

                // Attach wei to result object
                res.value = { wei: web3.toBigNumber(amount) }

                // Convert wei to USD and ETH
                convertToEthUsd(res.value);

                // Add withdrawal to pending map
                $scope.pendingMap[res.tx] = {
                    transactionHash: res.tx,
                    status: 'pending',
                    type: 'deposit',
                    time: Date.now(),
                    to_from: address,
                    value: res.value,
                    sign: '+'
                }

            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = true;
            $scope.transfer.deposit.message = "Deposit initiated. Please check Account page for status.";

            $scope.$apply();
        }).catch(function(error) {
            $scope.transfer.deposit.processing = false;
            $scope.transfer.deposit.success = false;
            $scope.transfer.deposit.message = "Deposit failed. Please see console for more details. \
                                               Confirm that originating account has enough funds before attempting a transfer.";
            console.error(error.stack);
            $scope.$apply();
        })

    }


    $scope.depositFunds = function(amount) {  
        
        $scope.transfer.deposit.message = '';
        $scope.transfer.withdrawal.message = '';
        $scope.transfer.deposit.processing = true;

        amount /= currency.USD;
        amount = Math.floor(web3.toWei(amount, "ether"));
    
        var account = $scope.addressFrom.demo;
        var index;
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

    function withdrawToAddress(amount, address) {

        contract.transferToAddress(amount, address, {
                from: web3.eth.accounts[0],
            }).then(function success(res) {

                // Attach wei to result object
                res.value = { wei: web3.toBigNumber(amount) }

                // Convert wei to USD and ETH
                convertToEthUsd(res.value);

                // Add withdrawal to pending map
                $scope.pendingMap[res.tx] = {
                    transactionHash: res.tx,
                    status: 'pending',
                    type: 'withdrawal',
                    time: Date.now(),
                    to_from: address,
                    value: res.value,
                    sign: '-'
                }

                $scope.transfer.withdrawal.processing = false;
                $scope.transfer.withdrawal.success = true;
                $scope.transfer.withdrawal.message = "Withdrawal initiated. Please check Account page for status.";
                $scope.$apply();

            }, function failutre(error) {

                $scope.transfer.withdrawal.processing = false;
                $scope.transfer.withdrawal.success = false;
                $scope.transfer.withdrawal.message = "Withdrawal failed. Please see console for more details. \
                                                      Confirm that Simple Wallet has enough funds before attempting a transfer.";
                console.error(error.stack);
                $scope.$apply();
            });
    };


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




                // var withdrawPromise = new Promise(function(resolve, reject) {
                //      web3.eth.getTransaction(result.transactionHash, function(error, transaction) {
                //          if (error) {
                //              reject(error);
                //          }
                         
    //             //          web3.eth.getBlock(transaction.blockHash, true, function(error, block) {
    //             //              if (error) {
    //             //                  return reject(error);
    //             //              }

    //             //              return resolve(block.timestamp);
    //             //          }) 
    //             //      })
    //             // });]]]



    // var simplewallet;
    // var simpleWalletPromise = SimpleWallet.deployed();

    // // var getBalance = function(address) {

    // //     return new Promise(function(resolve, reject) {
    // //             web3.eth.getBalance(contract.address, function(err, res) {
    // //             if (err) {
    // //                 console.error(err);
    // //             } else {
    // //                 $scope.balance = res.toNumber();
    // //                 $scope.balanceInEther = web3.fromWei($scope.balance, 'ether');
    // //             }          
    // //         });
    // //     })

    // // }

    // // var getBalances = function() {

    // //     $scope.demoAccounts = [];

    // //     var balancePromises = [];
    // //     for (demo of $scope.demoAccounts) {
    // //         balancePromises.push(getBalance(demo.address));
    // //     }

    // //     Promise.all(balancePromises).then(function(balances) {

    // //         for (var i = 0; i < 3; i++) {
    // //             $scope.demoAccounts[i].balance = balances[i];
    // //         }
    // //         $scope.$apply();
    // //     })
    // // }
    
    // $scope.demoAccounts = [];
    // var names = ['A', 'B', 'C'];
    // for (let i = 0; i < 3; i++) {
    //     $scope.demoAccounts.push({
    //         address: null,
    //         balance: null,
    //         name: 'Account ' + names[i] 
    //     });
    // }



    // $scope.withdrawFunds = function(address, amount) {
   
    //     contractPromise.then(function(contract) {
           
    //         contract.sendFunds(web3.toWei(amount, 'ether'), address, {
    //             from: $scope.accounts[0],

    //         }).then(function success(res) {
    //             $scope.transfer_success = true;
    //             $scope.newBalance = res;
    //             $scope.$apply();
    //         }, function error(err) {
    //             $scope.transfer_error = err;
    //             $scope.transfer_success = false;
    //             $scope.$apply();
    //         });

    //     });
    // }



    // // Update Demo Accounts
    // simpleWalletPromise.then(function(instance) {
    //     simplewallet = instance;
    // }).then(function() {

    //     var demoAddresses = [];
    //     var demoBalances = [];
    //     for (var i = 0; i < 3; i++) {
    //         demoAddresses.push(simplewallet.getDemoAccountAddress.call(i));
    //         demoBalances.push(simplewallet.getDemoAccountBalance.call(i));
    //     }

        

    //     // getAddresses();
    //     // getBalances();

    //     Promise.all(demoAddresses).then(function(result) {
    //         console.log(result);
    //         for (let i = 0; i < 3; i++) {
    //             $scope.demoAccounts[i].address = result[i];
    //         }
    //         $scope.$apply();
    //     });

    //     Promise.all(demoBalances).then(function(result) {
    //         console.log(result);
    //         for (let i = 0; i < 3; i++) {
    //             $scope.demoAccounts[i].balance = result[i].toNumber();
    //         }
    //         $scope.$apply();
    //     });
        
    // })


    // var updateDemoBalances = function() {

    //     for (var i = 0; i < 3; i++) {
    //         demoBalances.push(simplewallet.getDemoAccountBalance.call(i));
    //     }

    //     Promise.all(demoBalances).then(function(result) {
    //         console.log(result);
    //         for (let i = 0; i < 3; i++) {
    //             $scope.demoAccounts[i].balance = result[i].toNumber();
    //         }
    //         $scope.$apply();
    //     });
    // }
    

    // var updateDemoBalances = 

    // https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR