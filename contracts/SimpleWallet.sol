pragma solidity ^0.4.4;

import "./DemoAccount.sol";

contract SimpleWallet {

    DemoAccount[] demoList;
    uint demoCount;
    mapping (address => bool) demoSet;

    event DepositEvent(address _sender, uint amount);
    event WithdrawalEvent(address _sender, uint amount, address recipient);

    // Function constructor
    function SimpleWallet() {
        
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
        if (demoSet[msg.sender] == true) {
            DepositEvent(msg.sender, msg.value);
        }
    }

    //  Transfer mfunds from demo account at index to wallet
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
            WithdrawalEvent(msg.sender, amount, recipient);
            return this.balance;
        }
    }
    
    function getBalance() constant returns (uint) {
        return this.balance;
    }

    function killWallet() {
        suicide(msg.sender);
    }
}