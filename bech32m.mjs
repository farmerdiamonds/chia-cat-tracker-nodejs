function hextobyte(puzzlehash){
  let bytearray = [];
  for(let i = 0; i < puzzlehash.length; i+=2){
    const hexstring = puzzlehash.substring(i,i+2);
    bytearray.push(parseInt(hexstring,16));
  }
  return bytearray;
}

function convertTo5Bit(puzzlehash){
  let bytestring = "";
  let bit5array = [];
  for(let i = 0; i < puzzlehash.length; i++){
    bytestring += puzzlehash[i].toString(2).padStart(8,'0');
  }
  for(let i = 0; i < bytestring.length; i+=5){
    let substring = bytestring.substring(i,i+5);
    if(substring.length<5){
      bit5array.push(parseInt(bytestring.substring(i,i+1)+'0000',2));
    }else{
      bit5array.push(parseInt(bytestring.substring(i,i+5),2));
    }
    console.log(i+': '+bytestring.substring(i,i+5)+'->'+parseInt(bytestring.substring(i,i+5),2));
  }
  console.log(bytestring.length);
  console.log(bytestring);
  return bit5array;
}

function polymod(puzzlehash){
  const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  var chk = 1;
  for (var p = 0; p < puzzlehash.length; ++p) {
    var top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ puzzlehash[p];
    for (var i = 0; i < 5; ++i) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function createChecksum(puzzlehash){
  const m=0x2bc830a3;
  const prefix=[3,3,3,0,24,3,8];//xch
  const mod = polymod(prefix.concat(puzzlehash).concat([0,0,0,0,0,0]))^m;
  let checksum = [];
  for(var i = 0; i < 6; i++){
    checksum.push((mod >> 5 * (5-i)) &31);
  }
  return checksum;
}

function convertToXCHAddress(puzzlehash){
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  console.log(puzzlehash);
  puzzlehash = hextobyte(puzzlehash);
  console.log(puzzlehash);
  puzzlehash = convertTo5Bit(puzzlehash);
  const checksum = createChecksum(puzzlehash);
  console.log(checksum);
  puzzlehash = puzzlehash.concat(checksum);
  console.log('combined:');
  console.log(puzzlehash);
  let XCHAddress="xch1";
  for(let i = 0; i < puzzlehash.length; i++){
    XCHAddress += CHARSET.charAt(puzzlehash[i]);
  }
  return XCHAddress;
}

export{
  convertToXCHAddress
}