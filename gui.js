var dbFileElm = document.getElementById('dbfile');
var csvFileElm = document.getElementById('csvfile');
var vsvFileElm = document.getElementById('vsvfile');
var vsvButton = document.getElementById('vsvbutton');
var dbButton = document.getElementById('dbbutton');
var sidebar = document.getElementById('sidebar');
var statusElm = document.getElementById('status');


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

// Create a cell for entering commands
var createCell = function () {
	return function (container, sql) {
    let currentPosInHistory = -1;

    // Connect to the HTML element we 'print' to
    function print(text) {
      output.innerHTML = text.replace(/\n/g, '<br>');
    }
    function error(e) {
      console.log(e);
      errorElm.style.height = '2em';
      errorElm.textContent = e.message;
      output.textContent = "";
    }
    let storageLimit = 1024 * 128; // 128k
    async function saveQueryToHistory(sql, result) {
      let index = indexForNewItemInHistory();
      let k = 'qH' + String(index);
      // Don't store exessively large results.
      if (result.length > storageLimit) {
        result = "Result was too large to store without impacting performance."
      }
      await localforage.setItem(k, {sql:sql, result: result});
      localStorage.setItem('qHistLast', index);
      currentPosInHistory = index;
    }

    async function getItemFromHistory(i) {
      let k = 'qH' + String(i);
      const item = await localforage.getItem(k);
      editor.getDoc().setValue(item.sql);
      output.innerHTML = item.result;
    }

    async function saveToHistory() {
      let s = editor.getDoc().getValue();
      let r = output.innerHTML;
      // If there's no result to save, don't save to history.
      if (!r) {
        return;
      }
      currentPosInHistory = indexForMostRecentItemInHistory();
      let k = 'qH' + String(currentPosInHistory);
      const item = await localforage.getItem(k);
      // If the sql is the same as the most recent item, don't save.
      if (item && item.sql == s) {
        return;
      }
      saveQueryToHistory(s,r);
    }
    function getPreviousItemInHistory() {
      // Reached the end of the history or there's no history?
      if (!currentPosInHistory || !hasHistory()) {
        return;
      }
      // Not currently looking at the history.
      if (currentPosInHistory == -1) {
        currentPosInHistory = indexForMostRecentItemInHistory() + 1;
      }
      currentPosInHistory--;
      getItemFromHistory(currentPosInHistory);
    }
    function getNextItemInHistory() {
      // There's no history
      if (!hasHistory()) {
        return;
      }
      // Reached the most recent query in history.
      if (currentPosInHistory >= indexForMostRecentItemInHistory()) {
        return;
      }
      // Not looking at the history.
      if (currentPosInHistory == -1) {
        return;
      }
      currentPosInHistory++;
      getItemFromHistory(currentPosInHistory);
    }
    function noerror() {
      errorElm.style.height = '0';
    }
    // Run a command in the database
    function execute(commands) {
      statusElm.textContent = "";
      tic();
      worker.onerror = error;
      worker.onmessage = function (event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
          error({message: event.data.error});
          return;
        }
      
        tic();
        output.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
          output.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
        saveToHistory();
        updateSidebar();
      }
      worker.postMessage({ action: 'exec', sql: commands });
      output.textContent = "Fetching results...";
    }

    // Execute the commands when the button is clicked
    function execEditorContents() {
      noerror()
      execute(editor.getValue() + ';');
    }
    function addCellBelow() {
      var c = document.createElement('div');
      container.insertAdjacentElement('afterend', c);
      createCell(c);
    }
    function addCellAbove() {
      var c = document.createElement('div');
      container.insertAdjacentElement('beforebegin', c);
      createCell(c);
    }
    function deleteCell() {
      if (!container.previousSibling) {
        return;
      }
      let prev = container.previousSibling;
      container.parentElement.removeChild(container);
      prev.firstChild.focus();
    }
    const generateCSV = () => {
      if (!output.firstChild || (output.firstChild.tagName != "TABLE")) {
        return;
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.table_to_sheet(output.firstChild);
      XLSX.utils.book_append_sheet(wb, ws, 'test');
      XLSX.writeFile(wb, 'result.csv');
    }

    lastCellID++;
    container.id = lastCellID;

    // Add the command pane
		var commandsElm = document.createElement('textarea');
    if (!container.previousSibling) {
      sql = '-- Add a file to the database and then write a query here!\n\n';
    } else if (!sql) {
      sql = '\n\n\n';
    }
    commandsElm.textContent = sql;
    container.appendChild(commandsElm);

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // let selectedTheme = "default";
    // Use dark theme by default
    let selectedTheme = "3024-night";
    if (prefersDarkScheme.matches) {
      selectedTheme = "3024-night";
    }
    // Add syntax highlihjting to the textarea
    var editor = CodeMirror.fromTextArea(commandsElm, {
      mode: 'text/x-mysql',
      viewportMargin: Infinity,
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      autofocus: true,
      theme: selectedTheme,
      extraKeys: {
        "Ctrl-Enter": execEditorContents,
        "Ctrl-Space": "autocomplete",
        "Ctrl-S": savedb,
        "Ctrl-B": addCellBelow,
        "Ctrl-A": addCellAbove,
        "Ctrl-D": deleteCell,
        "Ctrl-S": generateCSV,
        "Alt-Left": getPreviousItemInHistory,
        "Alt-Right": getNextItemInHistory,
        "Tab": false,
        "Shift-Tab": false,
      }
    });

    // Add the tips line
		var tipsElm = document.createElement('span');
    tipsElm.className = "tips";
    tipsElm.innerHTML = 
                          "<b>Ctrl-Enter:</b> Run query, " +
                          "<b>Ctrl-Space:</b> Autocomplete, " +
                          "<b>Ctrl-B:</b> Add cell below, " +
                          "<b>Ctrl-A:</b> Add cell above, " +
                          "<b>Ctrl-D:</b> Delete this cell." +
                          "<b>Alt-Left:</b> Previous query in history." +
                          "<b>Alt-Right:</b> Next query in history." +
                          "";
    container.appendChild(tipsElm);

    // Add the error pane
		var errorElm = document.createElement('div');
    errorElm.className = "error";
    container.appendChild(errorElm);

    // Add the output pane
		var output = document.createElement('pre');
    output.className = "output";
    container.appendChild(output);
	}
}();

function addCell(sql) {
  var c = document.createElement('div');
  var cellsContainer = document.getElementById("container");
  cellsContainer.appendChild(c);
  createCell(c, sql);
}
addCell();

// Create an HTML table
var tableCreate = function () {
	function valconcat(vals, tagName) {
		if (vals.length === 0) return '';
		var open = '<' + tagName + '>', close = '</' + tagName + '>';
		return open + vals.join(close + open) + close;
	}
	return function (columns, values) {
		var tbl = document.createElement('table');
		var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
		var rows = values.map(function (v) { return valconcat(v, 'td'); });
		html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
		tbl.innerHTML = html;
		return tbl;
	}
}();

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
}

// Load a file into our DB by guessing the separators it uses.
dbButton.onclick = function () {
  dbFileElm.click();
};
// Load a db from a file
dbFileElm.onchange = function () {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function () {
		worker.onmessage = function () {
			toc("Loading database from file");
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
	r.readAsArrayBuffer(f);
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

	var f = vsvFileElm.files[0];
  if (!f) { return; }
	var r = new FileReader();
	r.onload = function () {
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
