var app = angular.module('myDapp', ['ngRoute']);

app.controller("mainController", function($scope) {
    
    $scope.accounts = [   
        '0x9cd0d61e52fc49ff00d643ed3c9b0ca9929c6c09',
        '0x3c8ca911e18434be9af5d5c4727e6a9ea4e1f8b8',
        '0x813517fdb99bd8c6dd4040d3abd1e916cec7928d',
        '0x27e7a30e1c4e21090fdc94f7a32993411ff7d444',
        '0xe314b8e4b6bb71b2def11b366470080198fd68ab',
        '0x1be2b5eae1a242dda735adcf648bbc02ceba7deb',
        '0x7395ae72c28dbfaa68636fef516545c287c8cd37',
        '0xca858a047e50915e01f2a1cba11d6f4045da33ff',
        '0x9935657e041a5cdd70ed2f1a4a1cb7cd4bb81f8c',
        '0xd872da1ec6b678c631a1b25de43c8698e6f3a85f' 
    ]

    var contract;
    SimpleWallet.deployed().then(function(instance) {
        contract = instance;
    }).then(function() {

        web3.eth.getBalance(contract.address, function(err, res) {
            if (err) {
                console.error(err);
            } else {
                $scope.balance = res.toNumber();
                $scope.balanceInEther = web3.fromWei($scope.balance, 'ether');
            }            
            $scope.$apply();
        })
    });

    // $scope.updateBalance = function() {

        
    // }


    // Create a promise from async web3 method
    var web3Promise = function(web3_async, param) {
        // Return a new promise
        return new Promise(function(resolve, reject) {
            web3_async(param, function(error, result) {
                if (error) { reject(error); }
                return resolve(result);
            })
        });
    };


    $scope.depositList = [];
    $scope.withdrawalList = [];

    var simplewallet;
    SimpleWallet.deployed().then(function(instance) {
        simplewallet = instance;
        return simplewallet;
    }).then(function() {

        var depositEvents = simplewallet.DepositEvent(null, {
                fromBlock: 0, 
                toBlock: 'latest',
            }, function(error, result) {

                // Transform amount to ether
                result.args.ether = web3.fromWei(result.args.amount, 'ether')

                $scope.depositList.push(result);
                $scope.$apply();
            }
        );

        

        var withdrawalEvents = simplewallet.WithdrawalEvent(null, {
                fromBlock: 0, 
                toBlock: 'latest',
            }, function(error, result) {

                // Instantiate promise derived from async web3 methods
                web3Promise(web3.eth.getTransaction, result.transactionHash) 
                // Use transaction to get block
                .then(function (transaction) {           
                    return web3Promise(web3.eth.getBlock, transaction.blockHash);
                })
                // Use block to get timestamp
                .then(function (block) {

                    // Transform amount to ether
                    result.args.ether = web3.fromWei(result.args.amount, 'ether')
                    result.timestamp = block.timestamp;
                    result.time = new Date(result.timestamp * 1000);

                    $scope.withdrawalList.push(result);
                    $scope.$apply();

                }).catch(function(error) {
                    console.error(error);
                });
            }
        );

        // Stop event watch upon leaving view
        $scope.$on('$destroy', function() {
            depositEvents.stopWatching();
            withdrawalEvents.stopWatching();
        });

    });
    
    




});


app.controller('aboutController', function($scope) {

    

});

app.controller("transactController", function($scope) {
 
    var simplewallet;
    var simpleWalletPromise = SimpleWallet.deployed();

    // var getBalance = function(address) {

    //     return new Promise(function(resolve, reject) {
    //             web3.eth.getBalance(contract.address, function(err, res) {
    //             if (err) {
    //                 console.error(err);
    //             } else {
    //                 $scope.balance = res.toNumber();
    //                 $scope.balanceInEther = web3.fromWei($scope.balance, 'ether');
    //             }          
    //         });
    //     })

    // }

    // var getBalances = function() {

    //     $scope.demoAccounts = [];

    //     var balancePromises = [];
    //     for (demo of $scope.demoAccounts) {
    //         balancePromises.push(getBalance(demo.address));
    //     }

    //     Promise.all(balancePromises).then(function(balances) {

    //         for (var i = 0; i < 3; i++) {
    //             $scope.demoAccounts[i].balance = balances[i];
    //         }
    //         $scope.$apply();
    //     })
    // }
    
    $scope.demoAccounts = [];
    var names = ['A', 'B', 'C'];
    for (let i = 0; i < 3; i++) {
        $scope.demoAccounts.push({
            address: null,
            balance: null,
            name: 'Account ' + names[i] 
        });
    }

    $scope.addressFrom = {
        demo: null,
        user: null,
    }

    $scope.addressTo = {
        demo: null,
        user: null,
    }

    // Update Demo Accounts
    simpleWalletPromise.then(function(instance) {
        simplewallet = instance;
    }).then(function() {

        var demoAddresses = [];
        var demoBalances = [];
        for (var i = 0; i < 3; i++) {
            demoAddresses.push(simplewallet.getDemoAccountAddress.call(i));
            demoBalances.push(simplewallet.getDemoAccountBalance.call(i));
        }

        

        // getAddresses();
        // getBalances();

        Promise.all(demoAddresses).then(function(result) {
            console.log(result);
            for (let i = 0; i < 3; i++) {
                $scope.demoAccounts[i].address = result[i];
            }
            $scope.$apply();
        });

        Promise.all(demoBalances).then(function(result) {
            console.log(result);
            for (let i = 0; i < 3; i++) {
                $scope.demoAccounts[i].balance = result[i].toNumber();
            }
            $scope.$apply();
        });
        
    })


    // https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR


    var depositFromAddress = function(amount, address) {

        web3.eth.sendTransaction(
            { 
                from: address, 
                to: simplewallet.address, 
                value: value
            }, function(error, result) {
                if (error) {
                    $scope.transfer_error = error;
                    $scope.transfer_success = false;
                } else {
                    $scope.transfer_success = true;
                }
                $scope.$apply();
            }
        );

    }

    web3.eth.defaultAccount=web3.eth.accounts[0];

    var depositFromDemo = function(amount, index) {

        simplewallet.transferFromDemo(amount, index, {
                from: web3.eth.accounts[0],
            }).then(function() {
            $scope.transfer_success = true;
            $scope.$apply();
        }).catch(function(error) {
            $scope.transfer_error = error.stack;
            $scope.transfer_success = false;
        })

    }


    $scope.depositFunds = function(amount) {   
        
        simpleWalletPromise.then(function() {

            amount *= 191;
            amount = web3.toWei(amount, "ether");
            if ($scope.addressFrom.user) {
                depositFromAddress(amount, $scope.addressFrom.user);
            } else {
                var account = $scope.addressFrom.demo;
                var index;
                for (var i = 0; i < 3; i++) {
                    if ($scope.addressFrom.demo == $scope.demoAccounts[i].name) {
                        index = i;
                        break;
                    }
                }
                depositFromDemo(amount, index);
            }
        });
    }

    // WITHDRAWAL

    var withdrawToAddress = function(amount, address) {

        simplewallet.transferToAddress(amount, address, {
                from: web3.eth.accounts[0],
            }).then(function() {
                $scope.transfer_success = true;
                $scope.$apply();
            }).catch(function(error) {
                $scope.transfer_error = error;
                $scope.transfer_success = false;
                $scope.$apply();
            });
    };


    $scope.withdrawFunds = function(amount) {   
        
        simpleWalletPromise.then(function() {

            amount *= 191;
            amount = web3.toWei(amount, "ether");
            var address;
            if ($scope.addressTo.user) {
                address = $scope.addressTo.user;
            } else {
                for (var i = 0; i < 3; i++) {
                    if ($scope.addressTo.demo == $scope.demoAccounts[i].name) {
                        address = $scope.demoAccounts[i].address;
                        break;
                    }
                }
            }

            withdrawToAddress(amount, address);
        });
    }



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
                         
                //          web3.eth.getBlock(transaction.blockHash, true, function(error, block) {
                //              if (error) {
                //                  return reject(error);
                //              }

                //              return resolve(block.timestamp);
                //          }) 
                //      })
                // });