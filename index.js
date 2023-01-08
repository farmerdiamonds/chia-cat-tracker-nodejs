import { getCATCoins } from './catcoins.mjs';
import { sumCATCoins } from './catcoins.mjs';
import { combineTargets } from './catcoins.mjs';

async function main(){
  // Blockheight for the CAT tracker, change to height of CAT issuance
  process.env.startBlockHeight = 2316000; // mintHeight for PLOT CAT2
  // Genesiscoin to start search
  process.env.genesisCoin = '0x9456a7d207802336ebe872d80e00a94d0ef69027500f81a9039083611da472e3'; //PLOT Genesiscoin
  let CATCoins = await getCATCoins();
  console.log("Found "+CATCoins.length+" unspent Coins");
  console.log("Combinig coins with same targetaddress ...");
  CATCoins = combineTargets(CATCoins);
  console.log("Found "+CATCoins.length+" different addresses");
  const CATAmount = sumCATCoins(CATCoins);
  console.log("Found "+CATAmount+" CAT mojos on chain");
}

main();
