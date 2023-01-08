import { nodeRequest } from './noderpc.mjs';
import { getCoinId } from './cointools.mjs';
import { getCoin } from './cointools.mjs';

async function getAdditionsByParentId(spendheight,parentcoinId){
  let payload = {};
  payload.header_hash = await getBlockHeaderHash(spendheight);
  const additionsRemovals = await nodeRequest('/get_additions_and_removals',JSON.stringify(payload));
  const additions = additionsRemovals.additions;
  let result = [];
  for (const addition in additions){
    if(additions[addition].coin.parent_coin_info==parentcoinId){
       const coin = await getCoin(await getCoinId(additions[addition].coin));
       result.push(coin.coin_record);
    }
  }
  return result;
}

async function getBlockAdditionsRemovals(blockheight){
  let payload = {};
  payload.header_hash = await getBlockHeaderHash(blockheight);
  const additionsRemovals = await nodeRequest('/get_additions_and_removals',JSON.stringify(payload));
  return additionsRemovals;
}

async function getBlockHeaderHash(blockheight){
  let payload = {};
  payload.height = blockheight;
  const blockrecord = await nodeRequest('/get_block_record_by_height',JSON.stringify(payload));
  return blockrecord.block_record.header_hash;
}

export {
  getAdditionsByParentId,
  getBlockAdditionsRemovals
}
