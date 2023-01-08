import { createHash } from 'node:crypto';
import { extractPuzzleHashAmount } from './coinspent.mjs';
import { nodeRequest } from './noderpc.mjs';
import { convertToXCHAddress } from './bech32m.mjs';

function removeDoubleCoins(unspentCoins){
  const coincount = unspentCoins.length;
  for(let i=0;i<coincount;i++){
    for(let j=i+1;j<coincount;j++){
      if(typeof unspentCoins[j].coin_id !== 'undefined'){
        if(unspentCoins[i].coin_id==unspentCoins[j].coin_id){
          delete unspentCoins[j];
        }
      }
    }
  }
  unspentCoins=removeNullCoin(unspentCoins);
  return unspentCoins;
}

function removeNullCoin(unspentCoins){
  let newCoinArray = [];
  for(const coin in unspentCoins){
    if(unspentCoins[coin] !=null)
      newCoinArray.push(unspentCoins[coin]);
  }
  return newCoinArray;
}

function removeCoin(unspentCoins,coinid){
  for(const coin in unspentCoins){
    if(unspentCoins[coin].coin_id == coinid){
      console.log("deleting coin with coinid: "+unspentCoins[coin].coin_id);
      delete unspentCoins[coin];
    }
  }
  unspentCoins = removeNullCoin(unspentCoins);
  return unspentCoins;
}

function addCoins(unspentCoins,coins){
  for(const coin in coins){
    unspentCoins.push(coins[coin]);
    console.log("adding coin with coinid: "+coins[coin].coin_id);
  }
  return unspentCoins;
}

function getCoinId(coin){
  let parent_coin_info = coin.parent_coin_info;
  let puzzle_hash = coin.puzzle_hash;
  const amount = coin.amount;
  if(parent_coin_info.indexOf("0x") == 0) {
    parent_coin_info = parent_coin_info.substring(2);
  }
  if(puzzle_hash.indexOf("0x") == 0) {
    puzzle_hash = puzzle_hash.substring(2);
  }
  const a = Buffer.from(parent_coin_info, 'hex');
  const b = Buffer.from(puzzle_hash, 'hex');
  const fixPreLength = (num, len) => (Array(len).join(0) + num).slice(-len);
  let amountHex = amount.toString(16);
  const byte_count = (amount.toString(2).length + 8) >> 3
  amountHex = fixPreLength(amountHex, byte_count * 2)
  if (amountHex.length % 2 == 1) {
    amountHex = '0' + amountHex
  }
  const c = Buffer.from(amountHex, 'hex');
  const d = Buffer.concat([a, b, c], a.length + b.length + c.length);
  const hash = createHash('sha256');
  hash.update(d);
  return "0x" + hash.digest('hex');
}

function mapCoinsToSpends(coins,spends){
  const transactions = [];
  for(const coin in coins){
    for(const spend in spends){
      if (coins[coin].coin.amount == spends[spend].amount){
        let transaction = {};
        transaction.target_address = spends[spend].address;
        transaction.target_puzzle_hash = spends[spend].puzzleHash;
        transaction.coin_id = getCoinId(coins[coin].coin);
        transaction.coin_puzzle_hash = coins[coin].coin.puzzle_hash;
        transaction.is_spent = coins[coin].spent;
        transaction.parent_coin_id = coins[coin].coin.parent_coin_info;
        transaction.amount = coins[coin].coin.amount;
        transaction.timestamp = coins[coin].timestamp;
        transaction.spent_block_index = coins[coin].spent_block_index;
        transactions.push(transaction);
        delete spends[spend];
	break;
      }
    }
  }
//  console.log('Mapped spends:');
//  console.log(transactions);
  return transactions;
}

async function getCoin(coinid){
  let payload = {};
  payload.name = coinid;
  const coin = await nodeRequest("/get_coin_record_by_name",JSON.stringify(payload));
  return coin;
}

async function getChildCoins(parentid){
  let payload = {};
  payload.parent_ids = [];
  payload.parent_ids.push(parentid);
  payload.start_height = process.env.startBlockHeight;
  payload.include_spent_coins = true;
  const childcoins = await nodeRequest('/get_coin_records_by_parent_ids',JSON.stringify(payload));
  if(childcoins.success){
    console.log('Child coind: '+JSON.stringify(childcoins));
    return childcoins.coin_records;
  }else{
//    console.log(childcoins);
    return childcoins;
  }
}

async function getAddressPuzzleHashAmountArray(CLVMSolution){
  let resultarray = [];
  // find the 51 commands and get the target PuzzleHash and amount
  const addressPuzzleHashAmountArray = extractPuzzleHashAmount(CLVMSolution);
  for (const element in addressPuzzleHashAmountArray){
    let resultelement = {};
    resultelement.puzzleHash = addressPuzzleHashAmountArray[element].puzzleHash;
    resultelement.amount = addressPuzzleHashAmountArray[element].amount;
    resultelement.address = convertToXCHAddress(addressPuzzleHashAmountArray[element].puzzleHash);
    resultarray.push(resultelement);
  }
  return resultarray;
}

export { 
  getCoinId,
  mapCoinsToSpends,
  getCoin,
  getChildCoins,
  getAddressPuzzleHashAmountArray,
  addCoins,
  removeCoin,
  removeNullCoin,
  removeDoubleCoins
}
