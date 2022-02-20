
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

    var createTableOutput = function () {
      return function (results) {
        output.style.maxHeight = "40vh";
        output.style.width = "auto";
        for (var i = 0; i < results.length; i++) {
          output.appendChild(tableCreate(results[i].columns, results[i].values));
        }
      }
    }();

    var cycleColor = (function () {
      var frequency = .9;
      var i = 0;
      return function () {
        i++;
        var red   = Math.round(Math.sin(frequency*i + 0) * 55 + 200);
        var green = Math.round(Math.sin(frequency*i + 2) * 55 + 200);
        var blue  = Math.round(Math.sin(frequency*i + 4) * 55 + 200);
        return "rgb(" + red + ", " + green + ", " + blue + ")";
      }
    })();

    // Create an HTML pivot chart
    var createPivotChart = function () {
      function createData(columns, values) {
        // A list of unique labels for the x axis, from the results' first column.
        const labels = [...new Set(values.map(x => x[0]))];
        const data = {
          labels: labels,
          datasets: createDatasets(columns, values, labels)
        };
        return data;
      }
      function createDatasets(columns, values, labels) {
        var datasets = []
        const pivots = [...new Set(values.map(x => x[1]))];
        const valueForLabelPivot = new Map(values.map(x => [x[0]+x[1], x[2]]));
        pivots.forEach(p => {
          datasets.push({
            label: p,
            data: labels.map(l => valueForLabelPivot.has(l+p) ? valueForLabelPivot.get(l+p) : 0),
            fill: false,
            borderColor: cycleColor(),
            tension: 0.1,
            maintainAspectRatio: false,
            responsive: true,
          });
        });
        return datasets;
      }
      return function (columns, values) {
        var lc = document.createElement('canvas');
        lc.id = "myChart"
        const ctx = lc.getContext('2d');
        const config = {
          type: 'line',
          data: createData(columns, values)
        };
        const myChart = new Chart(ctx, config);
        return lc;
      }
    }();

    // Create an HTML chart
    var createLineChart = function () {
      function createData(columns, values) {
        const labels = values.map(x => x[0]);
        const data = {
          labels: labels,
          datasets: createDatasets(columns, values)
        };
        return data;
      }
      function createDatasets(columns, values) {
        var datasets = []
        for (var i = 1; i < columns.length; i++) {
          datasets.push({
            label: columns[i],
            data: values.map(x => x[i]),
            fill: false,
            borderColor: cycleColor(),
            tension: 0.1,
            maintainAspectRatio: false,
            responsive: true,
          });
        }
        return datasets;
      }
      return function (columns, values) {
        var lc = document.createElement('canvas');
        lc.id = "myChart"
        const ctx = lc.getContext('2d');
        const config = {
          type: 'line',
          data: createData(columns, values)
        };
        const myChart = new Chart(ctx, config);
        return lc;
      }
    }();

    // Create a pretty table
    var createPrettyTable = function () {
      return function (columns, values, output) {
        new gridjs.Grid({
          columns: columns,
          data: values,
          sort: true,
          search: {
            enabled: true
          },
          pagination: true,
          style: {
            table: {
              'background-color': '#121212',
              'color': '#eee',
            },
            td: {
              'background-color': '#121212',
              'color': '#eee',
            },
            th: {
              'background-color': 'black',
              'color': '#eee',
            },
            container: {
              'background-color': '#121212',
              'color': '#eee',
            },
            header: {
              'background-color': '#121212',
              'color': '#eee',
            },
            footer: {
              'background-color': '#121212',
              'color': '#eee',
            },
            thead: {
              'background-color': 'black',
              'color': '#eee',
            },
            tbody: {
              'background-color': '#121212',
              'color': '#eee',
            },
          }
        }).render(output).forceRender();
      }
    }();

    var createPrettyTableOutput = function () {
      return function (results) {
        output.style.maxHeight = "initial";
        for (var i = 0; i < results.length; i++) {
          createPrettyTable(results[i].columns, results[i].values, output);
        }
      }
    }();

    var createLineChartOutput = function () {
      return function (results) {
        output.style.maxHeight = "initial";
        output.style.width = "70vw";
        for (var i = 0; i < results.length; i++) {
          output.appendChild(createLineChart(results[i].columns, results[i].values));
        }
      }
    }();

    var createPivotChartOutput = function () {
      return function (results) {
        output.style.maxHeight = "initial";
        output.style.width = "70vw";
        for (var i = 0; i < results.length; i++) {
          output.appendChild(createPivotChart(results[i].columns, results[i].values));
        }
      }
    }();

    let createSpecifiedOutput = null;
    function queryWithPrettyTableResults() {
      createSpecifiedOutput = createPrettyTableOutput;
      execEditorContents();
    }
    function queryWithTableResults() {
      createSpecifiedOutput = createTableOutput;
      execEditorContents();
    }
    function queryWithLineChartResults() {
      createSpecifiedOutput = createLineChartOutput;
      execEditorContents();
    }
    function queryWithPivotChartResults() {
      console.log("Querying pivot");
      createSpecifiedOutput = createPivotChartOutput;
      execEditorContents();
    }
    // Run a command in the database
    function execute(commands) {
      // Hide the intro text when we run a query
      intro.style.display = "none";

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
        createSpecifiedOutput(results);
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
    function openFile() {
      vsvFileElm.click();
    }
    function deleteCell() {
      if (container.parentElement.children.length <= 1) {
        return;
      }
      let prev = (container.previousSibling) ? container.previousSibling : container.nextSibling;
      container.parentElement.removeChild(container);

      // Set focus on the adjacent editor cell.
      editors.delete(container.id);
      var n = editors.get(prev.id);
      n.focus();
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
      sql = '-- Tip!\n-- Add a file to the database and then write a query here!\n\n';
    } else if (!sql) {
      let t = randomTips.next().value;
      sql = t ? '-- Tip!\n' + t : '\n\n\n';
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
        "Ctrl-Enter": queryWithTableResults,
        "Alt-Enter": queryWithLineChartResults,
        "Alt-I": queryWithPivotChartResults,
        "Alt-T": queryWithPrettyTableResults,
        "Ctrl-Space": "autocomplete",
        "Ctrl-S": savedb,
        "Ctrl-S": generateCSV,
        "Ctrl-O": openFile,
        "Alt-Left": getPreviousItemInHistory,
        "Alt-Right": getNextItemInHistory,
        "Tab": function(cm,e) {
          function hasNonWhiteSpace(s) { return /[^\s]/g.test(s); }
          let to = cm.getCursor();
          let from = {line: to.line, ch: 0};
          let pt = cm.getRange(from, to);
          if (hasNonWhiteSpace(pt)) {
            CodeMirror.commands.autocomplete(cm);
          } else {
            CodeMirror.commands.insertSoftTab(cm);
          }
        },
        "Esc" : function() {
          editor.getWrapperElement().focus();
        },
      }
    });
    editor.getWrapperElement().setAttribute("tabindex", "0");
    editors.set(container.id, editor);

    // Handle navigation between cells.
    editor.getWrapperElement().className += " editorContainer";
    editor.getWrapperElement().addEventListener('keydown', (event) => {
      // Ignore the event if we're not navigating the cell elements.
      let w = editor.getWrapperElement();
      if (w.className != document.activeElement.className) {
        return;
      }
      const keyName = event.key;
      if (keyName == 'a') {
        event.preventDefault();
        event.stopPropagation();
        addCellAbove();
      }
      if (keyName == 'b') {
        event.preventDefault();
        event.stopPropagation();
        addCellBelow();
      }
      if (keyName == 'd') {
        event.preventDefault();
        event.stopPropagation();
        deleteCell();
      }
      if (keyName == 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        editor.focus();
      }
      if (keyName == 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        console.log(document.activeElement);
        var p = editor.getWrapperElement().parentElement;
        var ps = p.previousSibling;
        if (!ps) return;
        var n = ps.children[1];
        n.focus();
      }
      if (keyName == 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        console.log(document.activeElement);
        var p = editor.getWrapperElement().parentElement;
        var ps = p.nextSibling;
        if (!ps) return;
        var n = ps.children[1];
        n.focus();
      }
    });

    // Add the tips line
		var tipsElm = document.createElement('span');
    tipsElm.className = "tips";
    tipsElm.innerHTML = 
                          "<b>Ctrl-Enter:</b> Plain Query Results, " +
                          "<b>Alt-T:</b> Rich Query Results, " +
                          "<b>Alt-Enter:</b> Line Chart Results, " +
                          "<b>Alt-I:</b> Pivot Chart Results, " +
                          "<b>Ctrl-Space or Tab:</b> Autocomplete. " +
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

