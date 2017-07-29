pragma solidity ^0.4.2;


contract DemoAccount {
    address owner;
    bytes32 name;

    // Create new contract owned by msg.sender
    function DemoAccount() {
        owner = msg.sender;
    }

     // Fallback function: involked when contract is called with a value, but without a function
     // Can only accept money from the SimpleWallet contract
    function() payable {
        if(msg.sender != owner) {
            revert();
        }
    }

    // Can only withdraw money into SimpleWallet
    function transferToWallet(uint amount) returns (uint) {
        // Send money to receiver
        owner.transfer(amount);
    }
    
    function getBalance() returns(uint) {
        return this.balance;
    }

    function killWallet() {
        if(msg.sender == owner) {
            suicide(owner);
        }
    }
}