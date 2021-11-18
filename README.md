# Dirty Little SQL
A dirty little SQL notebook for quickly loading CSV, tab-separated and excel files and running queries on them. At https://dirtylittlesql.com you can load
a file with millions of rows in it and query it in less than ten seconds.

![dirtylittlesql](https://user-images.githubusercontent.com/58846/136707932-a3a4f944-c6b7-4f56-9bd9-26741c42b9af.gif)

Uses a modified version of sql.js maintained at https://github.com/mwenge/sql.js

## Build Instructions

Run the following steps to bundle the `separators.js` file:

```sh
npm install browserify
npm install json2csv
browserify separators-pre.js > separators.js
```
