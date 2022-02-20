var csvFileElm = document.getElementById('csvfile');
var vsvFileElm = document.getElementById('vsvfile');
var vsvButton = document.getElementById('vsvbutton');
var sidebar = document.getElementById('sidebar');
var statusElm = document.getElementById('status');
var intro = document.getElementById('intro');


var editors = new Map([]);

var lastCellID = 0;
hotkeys('ctrl+b', function (event, handler){
    switch (handler.key) {
            case 'ctrl+b':
              addCell();
              break;
            default: break;
          }
});
// Start the worker in which sql.js will run
var worker = new Worker("worker.sql-wasm.js");

// Open a database
worker.postMessage({ action: 'open' });

// Add column names and table names to Codemirror's hints.
let hintWords=['SELECT']; // custom hints
const jsHinter = CodeMirror.hint.sql; // copy default hinter for JavaScript
CodeMirror.hint.sql = function (editor) {
    // Find the word fragment near cursor that needs auto-complete...
    const cursor = editor.getCursor();
    const currentLine = editor.getLine(cursor.line);
    let start = cursor.ch;
    let end = start;
    const rex=/[\w.]/; // a pattern to match any characters in our hint "words"
    // Our hints include function calls, e.g. "trap.getSource()"
    // so we search for word charcters (\w) and periods.
    // First (and optional), find end of current "word" at cursor...
    while (end < currentLine.length && rex.test(currentLine.charAt(end))) ++end;
    // Find beginning of current "word" at cursor...
    while (start && rex.test(currentLine.charAt(start - 1))) --start;
    // Grab the current word, if any...
    const curWord = start !== end && currentLine.slice(start, end);
    // Get the default results object from the JavaScript hinter...
    const dflt=jsHinter(editor);
    // If the default hinter didn't hint, create a blank result for now...
    const result = dflt || {list: []};
    // Set the start/end of the replacement range...
    result.to=CodeMirror.Pos(cursor.line, end);
    result.from=CodeMirror.Pos(cursor.line, start);
    // Add our custom hintWords to the list, if they start with the curWord...
    hintWords.forEach(h=>{if (h.startsWith(curWord)) result.list.push(h);});
    result.list.sort(); // sort the final list of hints
    return result;
};

function hasHistory() {
  return localStorage.getItem('qHistLast');
}

function indexForMostRecentItemInHistory() {
  let mostRecent = localStorage.getItem('qHistLast');
  return mostRecent ? parseInt(mostRecent, 10) : 0;
}

function indexForNewItemInHistory() {
  let mostRecent = localStorage.getItem('qHistLast');
  mostRecent = mostRecent ? parseInt(mostRecent, 10) + 1 : 0;
  return mostRecent;
}

function addCell(sql) {
  var c = document.createElement('div');
  var cellsContainer = document.getElementById("container");
  cellsContainer.appendChild(c);
  createCell(c, sql);
}
addCell();

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
}

// Load a file into our DB by guessing the separators it uses.
vsvButton.onclick = function () {
  vsvFileElm.click();
};
vsvFileElm.onchange = function () {
  function error(e) {
    console.log(e);
    statusElm.textContent = e;
  }
	function loadDB() {
		worker.onmessage = function () {
      statusElm.textContent = "Loaded " + f.name;
      updateSidebar();
		};
		tic();
		try {
			worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
		}
		catch (exception) {
			worker.postMessage({ action: 'open', buffer: r.result});
		}
	}

	var f = vsvFileElm.files[0];
  if (!f) { return; }
	var r = new FileReader();
	r.onload = function () {

    // If it's a sqlite DB load it.
    if ([".db", ".sqlite"].some(e => f.name.endsWith(e))) {
      loadDB();
      return;
    }

    let [data, sep, header] = getDataAndSeparator(r.result, f.name);
		if (sep == "-1") {
			error("Can't determine a field delimiter from the file suffix or contents.");
      return;
    }
    worker.onmessage = function (e) {
      console.log(e.data);
      if (e.data.progress) {
        statusElm.textContent = e.data.progress;
        return;
      }
      if (e.data.error) {
        statusElm.textContent = e.data.error;
        return;
      }
      // Show the schema of the loaded database
      updateSidebar();
      if (e.data.vsvtable) {
        let sql = "SELECT * FROM \"" + e.data.vsvtable + "\" LIMIT 10";
        addCell(sql);
        return;
      }
    };
    for (let d of data) {
      try {
        worker.postMessage({ action: 'createVSVTable', buffer: d[0], fileName: d[1],
          separator: sep, quick: true, header:header }, [d[0]]);
      }
      catch (exception) {
        worker.postMessage({ action: 'createVSVTable', buffer: d[0], fileName: d[1],
          separator: sep, quick: true, header:header });
      }
    }
	}
  statusElm.textContent = "Loading " + f.name;
	r.readAsArrayBuffer(f);
}


// Load a csv file into the db.
csvFileElm.onchange = function () {
	var f = csvFileElm.files[0];
	var r = new FileReader();
	r.onload = function () {
		worker.onmessage = function (e) {
      if (e.data.progress) {
        statusElm.textContent = e.data.progress;
        return;
      }
			toc("Loading database from csv file");
			// Show the schema of the loaded database
      updateSidebar();
		};
		tic();
		try {
			worker.postMessage({ action: 'createCSVTable', buffer: r.result, fileName: f.name }, [r.result]);
		}
		catch (exception) {
			worker.postMessage({ action: 'createCSVTable', buffer: r.result, fileName: f.name });
		}
	}
	r.readAsArrayBuffer(f);
}

// Save the db to a file
function savedb() {
	worker.onmessage = function (event) {
		toc("Exporting the database");
		var arraybuff = event.data.buffer;
		var blob = new Blob([arraybuff]);
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.href = window.URL.createObjectURL(blob);
		a.download = "sql.db";
		a.onclick = function () {
			setTimeout(function () {
				window.URL.revokeObjectURL(a.href);
			}, 1500);
		};
		a.click();
	};
	tic();
	worker.postMessage({ action: 'export' });
}

function updateSidebar() {
  // Create an HTML table
	var tableCreate = function () {
		function valconcat(vals, tagName) {
			if (vals.length === 0) return '';
			var open = '<' + tagName + '>', close = '</' + tagName + '>';
			return open + vals.join(close + open) + close;
		}
		return function (tableName, values) {
			var tbl = document.createElement('table');
			var html = '<thead><th colspan=2>' + tableName + '</th></thead>';
			let rows = values.map(x => valconcat(x, 'td'))
			html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
			tbl.innerHTML = html;
			return tbl;
		}
	}();

	function addToCodeMirrorHints(vs) {
		for (v of vs) {
      if (!hintWords.includes(v)) {
        hintWords.push(v);
      }
    }
	}

  function populateSidebar(e) {
    if (e.data.progress) {
      statusElm.textContent = e.data.progress;
    }
    var results = e.data.results;
    if (!results || !results.length) {
      return;
    }

    sidebar.innerHTML = "";
    // Each row is an array of the column values
    let rows = results[0].values;
		let tables = [... new Set(rows.map(x => x[0]))];
    addToCodeMirrorHints(tables);
		for (t of tables) {
				let fields = rows.filter(x => x[0] == t).map(x => [x[1],x[2]]);
        addToCodeMirrorHints(fields.map(x => x[0]));
				sidebar.appendChild(tableCreate(t, fields));
				sidebar.appendChild(document.createElement("br"));
		}
  }
  // Run a command in the database
  function execute(commands) {
    tic();
    worker.onmessage = populateSidebar;
    worker.postMessage({ action: 'exec', sql: commands });
  }
  let schemaSQL = "SELECT DISTINCT m.name, ii.name, ii.type " +
    "  FROM sqlite_schema AS m, " +
    "       pragma_table_info(m.name) AS ii " +
    "  WHERE m.type='table' " +
    "  ORDER BY 1; ";
	execute(schemaSQL+ ';');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('serviceworker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
