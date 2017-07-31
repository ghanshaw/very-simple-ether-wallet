pragma solidity ^0.4.4;

import "./DemoAccount.sol";

contract SimpleWallet {

    DemoAccount[] demoList;
    uint demoCount;
    // uint deposits;
    // uint withdrawals;
    mapping (address => bool) demoSet;

    event DepositEvent(address _sender, uint amount);
    event WithdrawalEvent(address _sender, uint amount, address recipient);

    // Function constructor
    function SimpleWallet() {

        // deposits = 0;
        // withdrawals = 0;
        
        // Limit number of demo accounts
        demoCount = 3;
        
        // Create 3 demo accounts
        for (uint i = 0; i < demoCount; i++) {
            DemoAccount demo = createDemoAccount();
            demoList.push(demo);
            demoSet[address(demo)] = true;
        }
    }
    
    function createDemoAccount() returns (DemoAccount) {
        return new DemoAccount();
    }

    // Fallback function: involked when contract is called with a value, but without a function
    function() payable {
        // deposits += msg.value;
        DepositEvent(msg.sender, msg.value);
        // updateBalance(msg.value);
    }

    // function updateBalance(uint amount) {
    //     deposits += amount;
    // }

    //  Transfer funds from demo account at index to wallet
    function transferFromDemo(uint amount, uint index) {
        demoList[index].transferToWallet(amount);
    }
    
    function getDemoAccountBalance(uint index) constant returns (uint) {
        DemoAccount demo = demoList[index];
        return demo.getBalance();
    }
    
    function getDemoAccountAddress(uint index) constant returns (address) {
        DemoAccount demo = demoList[index];
        return address(demo);
    }

    // Send money from wallet to another account (usually a demo account)
    function transferToAddress(uint amount, address recipient) returns (uint) {
        if(this.balance >= amount) {
    
            // Send money to receiver
            recipient.transfer(amount);

            // Emit event
            // withdrawals += amount;
            WithdrawalEvent(msg.sender, amount, recipient);
        }
    }

    // function getDepositsTotal() constant returns (uint) {
    //     return deposits;
    // }

    // function getWithdrawalsTotal() constant returns (uint) {
    //     return withdrawals;
    // }

    function killWallet() {
        suicide(msg.sender);
    }
}