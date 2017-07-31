// Specifically request an abstraction for SimpleWallet
var SimpleWallet = artifacts.require("SimpleWallet");

contract('SimpleWallet', function(accounts) {

    var account = web3.eth.coinbase;
    var balance = web3.eth.getBalance(web3.eth.coinbase);
    console.log('Starting balance of coinbase: ' + web3.fromWei(balance, 'ether').toNumber());
    // var account2 = accounts[1];


    it('the simple wallet should create three demo accounts', function() {

        var simplewallet;
        return SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;

            var demoList = [];
            for (var i = 0; i < 3; i++) {
                demoList.push(simplewallet.getDemoAccountAddress.call(i));
            }

            return Promise.all(demoList)

            // return simplewallet.isAllowedToSend.call(account1);
        }).then(function(list) {
            console.log(list)
            assert.equal(list.length, 3, 'The simple wallet should generate three accounts');
        }).catch(function(error) {
            console.error(error);
        });

    });

   

    


    // it('the owner should be allowed to send funds', function() {

    //     var simplewallet;
    //     return SimpleWallet.deployed().then(function(instance) {
    //         simplewallet = instance;
    //         return simplewallet.isAllowedToSend.call(account1);
    //     }).then(function(isAllowed) {
    //         assert.equal(isAllowed, true, 'The owner should be allowed to send funds');
    //     });

    // });

    // it('the other account should not be allowed to send funds', function() {

    //     var simplewallet;
    //     return SimpleWallet.deployed().then(function(instance) {
    //         simplewallet = instance;
    //         return simplewallet.isAllowedToSend.call(account2);
    //     }).then(function(isAllowed) {
    //         assert.equal(isAllowed, false, 'The other account should not be allowed to send funds');
    //     });

    // });

    // it('adding accounts to the allowed list', function() {
        
    //     var simplewallet;
    //     return SimpleWallet.deployed().then(function(instance) {
    //         simplewallet = instance;
    //         return simplewallet.isAllowedToSend.call(account2)
    //     }).then(function(isAllowed) {
    //         assert.equal(isAllowed, false, 'at first, should not allow account to send funds.');
    //     }).then(function() {
    //         return simplewallet.allowAddressToSendMoney(account2);
    //     }).then(function() {
    //         return simplewallet.isAllowedToSend.call(account2);
    //     }).then(function(isAllowed) {
    //         assert.equal(isAllowed, true, 'then, should allow other account to send funds.');
    //     }).then(function() {
    //         return simplewallet.disallowAddressToSendMoney(account2);
    //     }).then(function() {
    //         return simplewallet.isAllowedToSend.call(account2);
    //     }).then(function(isAllowed) {
    //         assert.equal(isAllowed, false, 'once again, should not allow other account to send funds.')
    //     });

    // });


    it('simple wallet should accept funds and emit deposit event', function(done) {
        var simplewallet;
        var event
        
        SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            event = simplewallet.allEvents();

            web3.eth.sendTransaction(
                { 
                    from: account, 
                    to: SimpleWallet.address, 
                    value: web3.toWei(1, 'ether') 
                });

        }).then(function() {

            event.watch(function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    // Now we'll check that the events are correct
                    assert.equal(result.event, 'DepositEvent');
                    assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), 1);
                    // assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
                    event.stopWatching();
                    done();
                }
            });
        })        
    });

    it('simple wallet should transfer funds to arbitrary account', function() {
        var simplewallet;
        var event; 
        
        return SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            // event = simplewallet.allEvents();

            return web3.eth.sendTransaction(
                { 
                    from: account, 
                    to: SimpleWallet.address, 
                    value: web3.toWei(1, 'ether') 
                });

                //  web3.eth.sendTransaction({ from: web3.eth.coinbase, to: SimpleWallet.address, value: web3.toWei(1, 'ether') });

        }).then(function() {

            return simplewallet.transferToAddress(web3.toWei(.5, 'ether'), web3.eth.accounts[1]);

        }).then(function(balance) {


            // console.log(balance);
            // done();
            return Promise.resolve(1);
        })
    });

    it('simple wallet should transfer funds to demo account', function(done) {
        var simplewallet;
        var event; 
        
        SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            event = simplewallet.allEvents();

            return web3.eth.sendTransaction(
                { 
                    from: account, 
                    to: SimpleWallet.address, 
                    value: web3.toWei(1, 'ether') 
                });

                //  web3.eth.sendTransaction({ from: web3.eth.coinbase, to: SimpleWallet.address, value: web3.toWei(1, 'ether') });

        }).then(function() {

            return simplewallet.getDemoAccountAddress(0);
        }).then(function(address) {
            console.log(address);
            return simplewallet.transferToAddress(web3.toWei(.5, 'ether'), address);
        }).then(function(receipt) {
            console.log(receipt);
            return simplewallet.getDemoAccountBalance.call(0);
        }).then(function(demoBalance) {

            event.watch(function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    // Now we'll check that the events are correct
                    assert.equal(result.event, 'WithdrawalEvent');
                    assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), .5);
                    assert.equal(web3.fromWei(demoBalance, 'ether'), .5);
                    // assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
                    event.stopWatching();
                    done();
                }
            });
        })   
    });

    it('simple wallet should transfer funds from demo account to itself', function(done) {
        var simplewallet;
        var demoAddress;
        var event; 
        
        SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            
            return web3.eth.sendTransaction(
                { 
                    from: account, 
                    to: SimpleWallet.address, 
                    value: web3.toWei(5, 'ether') 
                });
                //  web3.eth.sendTransaction({ from: web3.eth.coinbase, to: SimpleWallet.address, value: web3.toWei(1, 'ether') });

        }).then(function(tx) {
            console.log(tx);
            web3.eth.getTransaction
            return web3.eth.getTransactionReceipt(tx) 

        }).then(function(tx) {
            console.log(tx);
            return simplewallet.getDemoAccountAddress(0);
        }).then(function(address) {
            demoAddress = address;
            // Transfer 2.5 ether to demo account
            return simplewallet.transferToAddress(web3.toWei(2.5, 'ether'), address);
        }).then(function() {
            // Transfer 2 ether back to simple wallet
            event = simplewallet.allEvents();
            return simplewallet.transferFromDemo(web3.toWei(2, 'ether'), 0, {
                gas: 1000000,
            });
        }).then(function() {

            event.watch(function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(result);
                    // Now we'll check that the events are correct
                    assert.equal(result.event, 'DepositEvent');
                    assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), 2);
                    assert.equal(demoAddress, result.args._sender);
                    // assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
                    event.stopWatching();
                    done();
                }
            });
        }).catch(function(err) {
            console.log(err);
        })   
    });
    
    return;
    //     .then(function() {

    //         event.watch(function (error, result) {
    //             if (error) {
    //                 console.log(error);
    //             } else {
    //                 // Now we'll check that the events are correct
    //                 assert.equal(result.event, 'DepositEvent');
    //                 assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), 1);
    //                 // assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
    //                 event.stopWatching();
    //                 done();
    //             }
    //         });
    //     })        
    // });

    it('simple wallet should transfer funds to demo account', function(done) {
        var simplewallet;
        var event; 
        
        SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            event = simplewallet.allEvents();

            web3.eth.sendTransaction(
                { 
                    from: account, 
                    to: SimpleWallet.address, 
                    value: web3.toWei(12, 'ether') 
                });

        }).then(function() {

            event.watch(function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    // Now we'll check that the events are correct
                    assert.equal(result.event, 'DepositEvent');
                    assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), 1);
                    // assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
                    event.stopWatching();
                    done();
                }
            });
        })        
    });

    // it('should check forbidden Deposit Events', function(done) {
    //     var simplewallet;
    //     var event
        
    //     SimpleWallet.deployed().then(function(instance) {
    //         simplewallet = instance;
    //         event = simplewallet.allEvents();

    //         web3.eth.sendTransaction(
    //             { 
    //                 from: account2, 
    //                 to: SimpleWallet.address, 
    //                 value: web3.toWei(1, 'ether') 
    //             });

    //     }).then(function() {

    //         event.watch(function (error, result) {
    //             if (error) {
    //                 done();
    //             } else {vn
    //                 // Now we'll check that the events are correct
    //                 assert.equal(result.event, 'DepositEvent');
    //                 assert.equal(web3.fromWei(result.args.amount.valueOf(), 'ether'), 1);
    //                 assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
    //                 event.stopWatching();
    //                 done();
    //             }
    //         });
    //     })        
    // });

    // if('should check not allowed Deposit Events', function(done) {
    //     var simplewallet;

    //     SimpleWallet.deployed().then(function() {

    //     })

    //     web3.eth.sendTransaction(
    //         { from: web3.eth.accounts[1], to: SimpleWallet.address, value: web3.toWei(1, 'ether') }, 
    //         function(error, result) {
    //             if(error) {
    //                 done();
    //             } else {
    //                 done(result);
    //             }
    //         });
        
    // });
});