const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function two(n)   { return n<20 ? ones[n] : (tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'')).trim(); }
function three(n) { return n>=100 ? ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+two(n%100):'') : two(n); }

export function numberToWords(amount) {
  let n = Math.round(+amount);
  if (n === 0) return 'Zero Only';
  const parts = [];
  const cr = Math.floor(n/1e7); if(cr){parts.push(three(cr)+' Crore'); n%=1e7;}
  const la = Math.floor(n/1e5); if(la){parts.push(three(la)+' Lakh');  n%=1e5;}
  const th = Math.floor(n/1e3); if(th){parts.push(three(th)+' Thousand');n%=1e3;}
  if(n) parts.push(three(n));
  return parts.join(' ') + ' Only';
}
