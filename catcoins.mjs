import { getCoinId } from './cointools.mjs';
import { removeDoubleCoins } from './cointools.mjs';
import { removeNullCoin } from './cointools.mjs';
import { removeCoin } from './cointools.mjs';
import { addCoins } from './cointools.mjs';
import { getUnspentCoins } from './coinfinder.mjs';
import { getUnspentCoinsByCoinId } from './coinfinder.mjs';
import { readFileSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { nodeRequest } from './noderpc.mjs';

async function checkCoinspent(unspentCoins){
  let coinsspended = false;
  let payload = {};
  payload.start_height=process.env.startBlockHeight;
  payload.include_spent_coins=true;
  payload.names = [];
  for(const coin in unspentCoins){
    payload.names.push(unspentCoins[coin].coin_id);
  }
  const coins = await nodeRequest('/get_coin_records_by_names',JSON.stringify(payload));
  for(const coin in coins.coin_records){
    if(coins.coin_records[coin].spent){
      console.log("Found spent coin adding unspent children to unspentcoins.json");
      console.log(coins.coin_records[coin].coin);
      const spentcoinid = getCoinId(coins.coin_records[coin].coin);
      const newcoins = await getUnspentCoinsByCoinId(spentcoinid);
      unspentCoins = removeCoin(unspentCoins,spentcoinid);
      unspentCoins = addCoins(unspentCoins,newcoins);
      coinsspended = true;
      unspentCoins = removeDoubleCoins(unspentCoins);
    }
  }  
  if(coinsspended)
    saveUnspentCoins(unspentCoins);
  return unspentCoins;
}

function saveUnspentCoins(unspentCoins){
  let isRecent = false;
  try{
    writeFileSync("unspentcoins.json",JSON.stringify(unspentCoins));
    isRecent = true;
  }catch(e){
    console.log("Could not write unspentcoins.json: "+e);
  }
  return isRecent;
}

async function getCATCoins(){
  //load most recent unspent coins
  let unspentCoins;
  let isRecent = false;
  try{
    unspentCoins = JSON.parse(readFileSync("unspentcoins.json",{encoding:'utf8',flag:'r'}));
  }catch(e){
    console.log("Could not open unspentcoins.json: "+e);
    console.log("Recreating unspentcoins.json");
    unspentCoins = await getUnspentCoins();
    isRecent = saveUnspentCoins(unspentCoins);
  }
  if(!isRecent){
    unspentCoins = await checkCoinspent(unspentCoins);
  }
  return unspentCoins;
}

function sumCATCoins(CATCoins){
  let sum = 0;
  console.log(JSON.stringify(CATCoins));
  for(const coin in CATCoins){
    sum+=CATCoins[coin].amount;
  }
  return sum;
}

function combineTargets(CATCoins){
  for(const coin in CATCoins){
    let newAmount = CATCoins[coin].amount;
    for(const comparecoin in CATCoins){
      if((CATCoins[coin].target_address == CATCoins[comparecoin].target_address)&&(comparecoin!=coin)){
        newAmount += CATCoins[comparecoin].amount;
        delete CATCoins[comparecoin];
      }
    }
    CATCoins[coin].amount = newAmount;
  }
  CATCoins = removeNullCoin(CATCoins);
  return CATCoins;
}

export {
  getCATCoins,
  sumCATCoins,
  combineTargets
}
