// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },

    live : {
      network_id: 1, // Ethereum public network
      host: '127.0.0.1',
      port: 8545,
      gasPrice: '25000000000',
      gas: '2000000',
      from: '0xcE1D7F173B95C4dda0383Cf5b4BFF777880Ab97a'
    },
  }
}
