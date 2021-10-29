const suffixToSep = new Map([ 
  ["csv", ","],
  ["tsv", "\t"],
  ["psv", "|"],
]);
var enc = new TextEncoder(); // always utf-8
var dec = new TextDecoder(); // always utf-8

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
    return [toHex(enc.encode(suffixToSep.get(suff))[0]), suffixToSep.get(suff)];
  }
  // Use the first 10,000 bytes for guessing.
  let d = new Uint8Array(data.slice(0,10000));
  let s = guessSeparatorFromData(d);

  // Special case decoding tab to '\t'.
  let h = toHex(s);
  if (s == 9) {
    s = '\t';
  } else {
    s = dec.decode(new Uint8Array([s]));
  }

  return [h, s];
}


function getDataAndSeparator(d, filename) {
  let suff = filename.slice(-3);
  if (["xls", "lsx","ods"].includes(suff)) {
    let dt = convertExcelToCSV(d, filename);
    let header = hasHeader(dt, ',');
    return [convertExcelToCSV(d, filename), '2c', header];
  }
  let [sep, sepAsText] = guessSeparator(filename, d);
  let header = hasHeader(d, sepAsText);
  console.log(sep, sepAsText, header);
  return [[[d, filename]], sep, header];
}

function hasHeader(data, s) {
  let d = new Uint8Array(data.slice(0,10000));
  d = new Uint8Array(d.slice(0,d.indexOf(0x0a)));
  let st = dec.decode(d);
  let a = st.split(s);

  let u = [...new Set(a)];
  // Duplicate values in the header line suggest it is not a header.
  if (u.length != a.length) {
    return false;
  }

  // More than one non-alphanumeric field suggests not a header.
  var an = new RegExp("[^0-9\-\.]\+");
  let nums = a.filter(x => an.test(x) == false).length;
  if (nums > 1) {
    return false;
  }

  return true;
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

function testHeaderDetection() {
  let d = enc.encode("a,b,c\n1,2,3\n4,5,6");
  let result = hasHeader(d,',');
  console.log((result == true ? 'Pass. ' : 'FAIL. ') + 'Detect header ' + '. Actual result:', result);

  d = enc.encode("a,b,b\n1,2,3\n4,5,6");
  result = hasHeader(d,',');
  console.log((result == false ? 'Pass. ' : 'FAIL. ') + 'Detect duplicate items in header ' + '. Actual result:', result);

  d = enc.encode("a,1,2\n1,2,3\n4,5,6");
  result = hasHeader(d,',');
  console.log((result == false ? 'Pass. ' : 'FAIL. ') + 'Detect numbers header ' + '. Actual result:', result);

  d = enc.encode("a,b,c\n1,2,3\n4,5,6");
  result = hasHeader(d,',');
  console.log((result == true ? 'Pass. ' : 'FAIL. ') + 'Detect numbers header ' + '. Actual result:', result);

  d = enc.encode("a,b1,c2\n1,2,3\n4,5,6");
  result = hasHeader(d,',');
  console.log((result == true ? 'Pass. ' : 'FAIL. ') + 'Detect numbers header ' + '. Actual result:', result);

  d = enc.encode("2021-02-01,2021-02-01,c\n1,2,3\n4,5,6");
  result = hasHeader(d,',');
  console.log((result == fail ? 'Pass. ' : 'FAIL. ') + 'Detect numbers header ' + '. Actual result:', result);
}
