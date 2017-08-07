// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';


// Import our contract artifacts and turn them into usable abstractions.
import simplewallet_artifacts from '../../build/contracts/SimpleWallet.json';

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/style.scss";
// alert('misstra know it all')

var SimpleWallet = window.SimpleWallet = contract(simplewallet_artifacts);

try {
    // Bootstrap the SimpleWallet abstraction for Use.
    SimpleWallet.setProvider(web3.currentProvider);
} catch(e) {
    console.log(e);
}



// Import the page's CSS. Webpack will know what to do with it.
// var load_svg = require("svg-inline-loader!../images/load.svg");
// var load_url = require("file-loader!../images/load.svg");

// import load_svg from '../images/load.svg';

// import jQuery from "../../node_modules/jquery/dist/jquery.js";
// Import jQuery
window.jQuery = window.$ = require("../../node_modules/jquery/dist/jquery.js");

// // Import particle background
import './particleground.js';
import './particles.js';

// console.log(jQuery);

// Import Angular modules
import '../../node_modules/angular/angular.js';
import '../../node_modules/angular-route/angular-route.js';

// Import Angular App
import './app.js';