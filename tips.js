const tips = [
      "-- To get a line chart instead of a table for your result, run the query with Alt-Enter.\n" +
      "-- The first column in your results will be treated as the X axis of the chart.\n" +
      "-- The remaining columns will be treated as values to plot on the chart.\n\n" ,

      "-- To get a pivot chart instead of a table for your result, run the query with Alt-P.\n" +
      "-- The first column in your results will be treated as the X axis of the chart.\n" +
      "-- The second column in your results will be treated as the legends to plot.\n" +
      "-- The third column will be treated as values to plot on the chart for each legend.\n\n" ,

      "-- Use Alt-T to get results in a pretty table that you can filter and sort.\n\n" ,

      "-- Use Ctrl-S to save the result of your query to a CSV file.\n\n" ,

      "-- Use Tab and Shift-Tab to move between cells.\n\n" ,

      "-- Use Ctrl-P to save a print-friendly version of your notebook to PDF.\n\n" ,

      "-- Use Alt-Left and Alt-Right to move left and right in your query history.\n\n"
];
function* makeShuffleGenerator(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
      yield array[i];
    }
    return;
}

const randomTips = makeShuffleGenerator(tips);
