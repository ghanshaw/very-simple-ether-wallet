// Specifically request an abstraction for SimpleWallet
var SimpleWallet = artifacts.require("SimpleWallet");

contract('SimpleWallet', function(accounts) {

    var account1 = accounts[0];
    var account2 = accounts[1];

    it('the owner should be allowed to send funds', function() {

        var simplewallet;
        return SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            return simplewallet.isAllowedToSend.call(account1);
        }).then(function(isAllowed) {
            assert.equal(isAllowed, true, 'The owner should be allowed to send funds');
        });

    });

    it('the other account should not be allowed to send funds', function() {

        var simplewallet;
        return SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            return simplewallet.isAllowedToSend.call(account2);
        }).then(function(isAllowed) {
            assert.equal(isAllowed, false, 'The other account should not be allowed to send funds');
        });

    });

    it('adding accounts to the allowed list', function() {
        
        var simplewallet;
        return SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            return simplewallet.isAllowedToSend.call(account2)
        }).then(function(isAllowed) {
            assert.equal(isAllowed, false, 'at first, should not allow account to send funds.');
        }).then(function() {
            return simplewallet.allowAddressToSendMoney(account2);
        }).then(function() {
            return simplewallet.isAllowedToSend.call(account2);
        }).then(function(isAllowed) {
            assert.equal(isAllowed, true, 'then, should allow other account to send funds.');
        }).then(function() {
            return simplewallet.disallowAddressToSendMoney(account2);
        }).then(function() {
            return simplewallet.isAllowedToSend.call(account2);
        }).then(function(isAllowed) {
            assert.equal(isAllowed, false, 'once again, should not allow other account to send funds.')
        });

    });


    it('should check allowable Deposit Events', function(done) {
        var simplewallet;
        var event
        
        SimpleWallet.deployed().then(function(instance) {
            simplewallet = instance;
            event = simplewallet.allEvents();

            web3.eth.sendTransaction(
                { 
                    from: account1, 
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
                    assert.equal(result.args._sender.valueOf(), web3.eth.accounts[0]);
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