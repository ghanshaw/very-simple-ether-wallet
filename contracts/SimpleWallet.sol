pragma solidity ^0.4.4;

import "./DemoAccount.sol";

contract SimpleWallet {

    // Contract creator
    address owner;

    // Number of demo accounts
    uint demoCount;

    // List of demo accounts
    DemoAccount[] demoList;

    // Events fire whenever deposit or withdrawal is made
    event DepositEvent(address _sender, uint amount, address recipient);
    event WithdrawalEvent(address _sender, uint amount, address recipient);

    // Function constructor
    function SimpleWallet() {
        owner = msg.sender;
        
        // Limit number of demo accounts
        demoCount = 3;
        
        // Create 3 demo accounts
        for (uint i = 0; i < demoCount; i++) {
            DemoAccount demo = createDemoAccount();
            demoList.push(demo);
        }
    }
    
    // Create new demo account
    function createDemoAccount() returns (DemoAccount) {
        return new DemoAccount();
    }

    // Fallback function: involked when contract is called with a value, but without a function
    function() payable {
        DepositEvent(msg.sender, msg.value, this);
    }

    //  Transfer funds from demo account at index to wallet
    function transferFromDemo(uint amount, uint index) {
        demoList[index].transferToWallet(amount);
    }
    
    // Get balance of demo account using index
    function getDemoAccountBalance(uint index) constant returns (uint) {
        DemoAccount demo = demoList[index];
        return demo.getBalance();
    }
    
    // Get address of demo account using index
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
        }
    }

    function killWallet() {
        if(msg.sender == owner) {
            suicide(owner);
        }
    }
}