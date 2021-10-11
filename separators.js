const suffixToSep = new Map([ 
  ["csv", ","],
  ["tsv", "\t"],
  ["psv", "|"],
]);
var enc = new TextEncoder(); // always utf-8

let toHex = x => x.toString(16).padStart(2,'0')
function getPossibleSeps(seps) {
  // Guess the separator as the char that occurs a consistent number of times
  // in each line.
  let s = [];
  for (const [k, v] of seps) {
    let max = Math.max(...v);
    if (!max)
      continue
    let min = Math.min(...v);
    if (min == max) {
      s.push(k);
    }
  }
  return s;
}

// Returns the guessed separator as a decimal integer, e.g. '\t' as 9.
// Returns -1 if we can't figure out the separator used in the file.
function guessSeparatorFromData(d) {

  // Number of lines to use for guessing is the number of newlines, to a max of 10
  let ltc = Math.min(d.filter(x => x === 0x0a).length, 10);

  let seps = new Map();
  suffixToSep.forEach((x,y,z) => seps.set(enc.encode(x)[0], new Array(ltc).fill(0)));

  let cl = 0; // line count
  let skip = false;
  // Count the appearances of each separator in each line.
  for (let i = 0; i < d.byteLength; i++) {
    // Ignore anything inside double quotes
    if (d[i] == 0x22) { skip = !skip; }
    if (skip) { continue; }

    // Check for newline (\n)
    if (d[i] == 0x0a) {
      cl++;
      if (cl == ltc)
        break;
      continue;
    }
    if (seps.has(d[i])) {
      let cv = seps.get(d[i]);
      cv[cl]++
      seps.set(d[i], cv);
    }
  }
  let s = getPossibleSeps(seps);
  if (s.length != 1)
    return -1;
  return s[0];
}

// Take all the sheets in a workbook and return them as an
// array of [csvdata, tablename]
function convertExcelToCSV(d, filename) {
  var data = new Uint8Array(d);
  var wb = XLSX.read(data,{type:'array'});
  let sheets = [];
  for (let i = 0, l = wb.SheetNames.length; i < l; i += 1) {
    let s = wb.Sheets[wb.SheetNames[i]];
    var csv = XLSX.utils.sheet_to_csv(s, { type:'array', header: 1 });
    sheets.push([enc.encode(csv), filename + wb.SheetNames[i]]);
  }
  return sheets;
}

function guessSeparator(filename, data) {
  let suff = filename.slice(-3);
  if (suffixToSep.has(suff)) {
    return toHex(enc.encode(suffixToSep.get(suff))[0]);
  }
  // Use the first 10,000 bytes for guessing.
  let d = new Uint8Array(data.slice(0,10000));
  return toHex(guessSeparatorFromData(d));
}


function getDataAndSeparator(d, filename) {
  let suff = filename.slice(-3);
  if (["xls", "lsx"].includes(suff)) {
    return [convertExcelToCSV(d, filename), '2c'];
  }
  let sep = guessSeparator(filename, d);
  return [[[d, filename]], sep];
}

function testGuessSeparatorFromData() {
  let d = enc.encode("a,b,c\n1,2,3\n4,5,6");
  let result = toHex(guessSeparatorFromData(d));
  console.log((result == '2c' ? 'Pass. ' : 'FAIL. ') + 'Detect CSV ' + '. Actual result:', result);

  d = enc.encode("a\tb\tc\n1\t2\t3\n4\t5\t6");
  result = toHex(guessSeparatorFromData(d));
  console.log((result == '09' ? 'Pass. ' : 'FAIL. ') + 'Detect TSV ' + '. Actual result:', result);

  d = enc.encode("a|b|c\n1|2|3\n2|3|4");
  result = toHex(guessSeparatorFromData(d));
  console.log((result == '7c' ? 'Pass. ' : 'FAIL. ') + 'Detect pipe ' +  '. Actual result:', result);

  d = enc.encode("a,\"b,e\",c\n1,2,3\n4,5,6");
  result = toHex(guessSeparatorFromData(d));
  console.log((result == '2c' ? 'Pass. ' : 'FAIL. ') + 'Detect CSV with double quotes in header ' + '. Actual result:', result);
}
