import { execSync } from 'node:child_process';
import { nodeRequest } from './noderpc.mjs';

function decodeSolution(solution){
  return execSync("opd "+solution);
}

async function getPuzzleSolution(coin_id,height){
  let payload = {};
  payload.height = height;
  payload.coin_id = coin_id;
  return await nodeRequest("/get_puzzle_and_solution",JSON.stringify(payload));
}

function getIndicesOf(searchStr, str) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

function extractPuzzleHashAmount(CLVMSolution){
  const startpositions = getIndicesOf("(51", CLVMSolution);
  let addressAmount = [];
  for (const position in startpositions){
    const endpos = startpositions[position] + 70;
    const endposbracket = CLVMSolution.slice(endpos+3).search(/[( )]/)+endpos+3;
    let result = {};
    result.puzzleHash = CLVMSolution.substring(startpositions[position]+6, endpos);
    let amount = CLVMSolution.substring(endpos+1,endposbracket);
    if(amount.indexOf('0x') == 0){
      amount = amount.substring(2);
      result.amount = parseInt(amount,16);
    }else{
      result.amount = amount;
    }
    addressAmount.push(result);
  }
  return addressAmount;
}

function extractOfferNonce(CLVMSolution){
  return CLVMSolution;
}

function convertToXCHAddress(puzzleHash){
  return execSync("cdv encode "+puzzleHash).toString().replace("\n","");
}

export {
  convertToXCHAddress,
  extractPuzzleHashAmount,
  extractOfferNonce,
  decodeSolution,
  getPuzzleSolution
}
