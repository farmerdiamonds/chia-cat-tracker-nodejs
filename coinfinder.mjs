import { getCoinId } from './cointools.mjs';
import { getCoin } from './cointools.mjs';
import { mapCoinsToSpends } from './cointools.mjs';
import { getAddressPuzzleHashAmountArray } from './cointools.mjs';
import { getAdditionsByParentId } from './blocktools.mjs';
import { getPuzzleSolution } from './coinspent.mjs';
import { decodeSolution } from './coinspent.mjs';
import { getBlockAdditionsRemovals } from './blocktools.mjs';

const offerSettlementPuzzleHash = '0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79'; // CHIA offerSettlementPuzzleHash
let unspentCoins = [];

async function lastChildInAdditions(additions,nextCoin){
  const nextCoinId = getCoinId(nextCoin);
  for(const searchcoin in additions){
    const addCoin = additions[searchcoin].coin;
    if(addCoin.parent_coin_info == nextCoinId){
      const addCoinId = await getCoinId(addCoin);
      console.log("found Coinid: "+addCoinId);
      nextCoin = lastChildInAdditions(additions,addCoin);
    }
  }
  return nextCoin;
}

async function getUnspentCoinsByCoinId(coinId){
  const coin = await getCoin(coinId);
  const spendHeight = coin.coin_record.spent_block_index;
  const puzzleSolution = await getPuzzleSolution(coinId,spendHeight);
  const solution = puzzleSolution.coin_solution.solution.slice(2);
  const CLVMSolution = decodeSolution(solution).toString();
  const coinspends = await getAddressPuzzleHashAmountArray(CLVMSolution);
  let childcoins = [];
  let coinrecords = {};
  console.log(CLVMSolution);
  //Check if Solution could be an offer
  if(CLVMSolution.includes(offerSettlementPuzzleHash)){
    console.log('Offer found');
    const additionsRemovals = await getBlockAdditionsRemovals(spendHeight);
    console.log('Additions:');
    //Cycle through all additions in the spend block to find the last child added
    for(const addition in additionsRemovals.additions){
      let addCoin = additionsRemovals.additions[addition].coin;
      let addCoinId = await getCoinId(addCoin);
      //found first addition
      if(addCoin.parent_coin_info==coinId){
    //find addition for this coin
    addCoin = await lastChildInAdditions(additionsRemovals.additions,addCoin);
    addCoinId = await getCoinId(addCoin);
    let tempcoin = await getCoin(addCoinId);
    childcoins.push(tempcoin.coin_record);
      }
      console.log(addCoinId);
      console.log(JSON.stringify(addCoin));
      console.log('-----');
    }
  }else{
    console.log('getting childcoins for id: '+coinId);
    childcoins = await getAdditionsByParentId(spendHeight,coinId);
  
    for(const childCoin in childcoins){
      const childCoinId = getCoinId(childcoins[childCoin].coin);
      console.log(childCoinId);
    }
    console.log('\n\n-------\n');
  }
  console.log(childcoins);
  const mappedspends = mapCoinsToSpends(childcoins,coinspends);
  console.log('Mappedspends: ' +JSON.stringify(mappedspends)+'\n');
  for(const coin in mappedspends){
    if(mappedspends[coin].spent_block_index == 0)
      unspentCoins.push(mappedspends[coin]);
    else
      await getUnspentCoinsByCoinId(mappedspends[coin].coin_id);
  }
  return unspentCoins;
}

async function getUnspentCoins(){
  const unspentCoins = await getUnspentCoinsByCoinId(process.env.genesisCoin);
  return unspentCoins;
}

export { 
  getUnspentCoins,
  getUnspentCoinsByCoinId
};
