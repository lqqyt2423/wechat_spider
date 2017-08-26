/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _stringify = __webpack_require__(1);

	var _stringify2 = _interopRequireDefault(_stringify);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	/*
	* A webworker to identify whether the component need to be re-rendered
	*
	* the core idea is that, we do the caclulation here, compare the new filtered record with current one.
	* if they two are same, we'll send no update event out.
	* otherwise, will send out a full filtered record list, to replace the current one.
	*
	* The App itself will just need to display all the filtered records, the filter and max-limit logic are handled here.
	*/
	var recordList = [];
	// store all the filtered record, so there will be no need to re-calculate the filtere record fully through all records.
	self.FILTERED_RECORD_LIST = [];
	var defaultLimit = 500;
	self.currentStateData = []; // the data now used by state
	self.filterStr = '';

	self.canLoadMore = false;
	self.updateQueryTimer = null;
	self.refreshing = true;
	self.beginIndex = 0;
	self.endIndex = self.beginIndex + defaultLimit - 1;
	self.IN_DIFF = false; // mark if currently in diff working

	var getFilterReg = function getFilterReg(filterStr) {
	    var filterReg = null;
	    if (filterStr) {
	        var regFilterStr = filterStr.replace(/\r\n/g, '\n').replace(/\n\n/g, '\n');

	        // remove the last /\n$/ in case an accidential br
	        regFilterStr = regFilterStr.replace(/\n*$/, '');

	        if (regFilterStr[0] === '/' && regFilterStr[regFilterStr.length - 1] === '/') {
	            regFilterStr = regFilterStr.substring(1, regFilterStr.length - 2);
	        }

	        regFilterStr = regFilterStr.replace(/((.+)\n|(.+)$)/g, function (matchStr, $1, $2) {
	            // if there is '\n' in the string
	            if ($2) {
	                return '(' + $2 + ')|';
	            } else {
	                return '(' + $1 + ')';
	            }
	        });

	        try {
	            filterReg = new RegExp(regFilterStr);
	        } catch (e) {
	            console.error(e);
	        }
	    }

	    return filterReg;
	};

	self.resetDisplayRecordIndex = function () {
	    self.beginIndex = 0;
	    self.endIndex = self.beginIndex + defaultLimit - 1;
	};

	self.getFilteredRecords = function () {
	    // const filterReg = getFilterReg(self.filterStr);
	    // const filterdRecords = [];
	    // const length = recordList.length;

	    // // filtered out the records
	    // for (let i = 0 ; i < length; i++) {
	    //     const item = recordList[i];
	    //     if (filterReg && filterReg.test(item.url)) {
	    //         filterdRecords.push(item);
	    //     }

	    //     if (!filterReg) {
	    //         filterdRecords.push(item);
	    //     }
	    // }

	    // return filterdRecords;

	    return self.FILTERED_RECORD_LIST;
	};

	/*
	* calculate the filtered records, at each time the origin list is updated
	* @param isFullyCalculate bool,
	         whether to calculate the filtered record fully, if ture, will do a fully calculation;
	         otherwise, will only calculate the "listForThisTime", and push the filtered one to filteredRecordList
	* @param listForThisTime object,
	          the list which to be calculated for this time, usually the new
	*/
	self.calculateFilteredRecords = function (isFullyCalculate) {
	    var listForThisTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	    var filterReg = getFilterReg(self.filterStr);
	    var targetList = [];
	    if (isFullyCalculate) {
	        self.FILTERED_RECORD_LIST = [];
	        var length = recordList.length;
	        // filtered out the records
	        for (var i = 0; i < length; i++) {
	            var item = recordList[i];
	            if (!filterReg || filterReg && filterReg.test(item.url)) {
	                self.FILTERED_RECORD_LIST.push(item);
	            }
	        }
	    } else {
	        listForThisTime.forEach(function (item) {
	            var index = self.FILTERED_RECORD_LIST.findIndex(function (record) {
	                return item.id === record.id;
	            });

	            if (index >= 0) {
	                self.FILTERED_RECORD_LIST[index] = item;
	            } else {
	                self.FILTERED_RECORD_LIST.push(item);
	            }
	        });
	    }
	};

	// diff the record, so when the refreshing is stoped, the page will not be updated
	// cause the filtered records will be unchanged
	self.diffRecords = function () {
	    if (self.IN_DIFF) {
	        return;
	    }
	    self.IN_DIFF = true;
	    // mark if the component need to be refreshed
	    var shouldUpdateRecord = false;

	    var filterdRecords = self.getFilteredRecords();

	    if (self.refreshing) {
	        self.beginIndex = filterdRecords.length - 1 - defaultLimit;
	        self.endIndex = filterdRecords.length - 1;
	    } else {
	        if (self.endIndex > filterdRecords.length) {
	            self.endIndex = filterdRecords.length;
	        }
	    }

	    var newStateRecords = filterdRecords.slice(self.beginIndex, self.endIndex + 1);
	    var currentDataLength = self.currentStateData.length;
	    var newDataLength = newStateRecords.length;

	    if (newDataLength !== currentDataLength) {
	        shouldUpdateRecord = true;
	    } else {
	        // only the two with same index and the `_render` === true then we'll need to render
	        for (var i = 0; i < currentDataLength; i++) {
	            var item = self.currentStateData[i];
	            var targetItem = newStateRecords[i];
	            if (item.id !== targetItem.id || targetItem._render === true) {
	                shouldUpdateRecord = true;
	                break;
	            }
	        }
	    }

	    self.currentStateData = newStateRecords;

	    self.postMessage((0, _stringify2.default)({
	        type: 'updateData',
	        shouldUpdateRecord: shouldUpdateRecord,
	        recordList: newStateRecords
	    }));
	    self.IN_DIFF = false;
	};

	// check if there are many new records arrivied
	self.checkNewRecordsTip = function () {
	    if (self.IN_DIFF) {
	        return;
	    }

	    var newRecordLength = self.getFilteredRecords().length;
	    self.postMessage((0, _stringify2.default)({
	        type: 'updateTip',
	        data: newRecordLength - self.endIndex > 20
	    }));
	};

	self.updateSingle = function (record) {
	    recordList.forEach(function (item) {
	        item._render = false;
	    });

	    var index = recordList.findIndex(function (item) {
	        return item.id === record.id;
	    });

	    if (index >= 0) {
	        // set the mark to ensure the item get re-rendered
	        record._render = true;
	        recordList[index] = record;
	    } else {
	        recordList.push(record);
	    }
	    self.calculateFilteredRecords(false, [record]);
	};

	self.updateMultiple = function (records) {
	    recordList.forEach(function (item) {
	        item._render = false;
	    });

	    records.forEach(function (record) {
	        var index = recordList.findIndex(function (item) {
	            return item.id === record.id;
	        });

	        if (index >= 0) {
	            // set the mark to ensure the item get re-rendered
	            record._render = true;
	            recordList[index] = record;
	        } else {
	            recordList.push(record);
	        }
	    });

	    self.calculateFilteredRecords(false, records);
	};

	self.addEventListener('message', function (e) {
	    var data = JSON.parse(e.data);
	    switch (data.type) {
	        case 'diff':
	            {
	                self.diffRecords();
	                break;
	            }
	        case 'updateQuery':
	            {
	                // if filterStr or limit changed
	                if (data.filterStr !== self.filterStr) {
	                    self.updateQueryTimer && clearTimeout(self.updateQueryTimer);
	                    self.updateQueryTimer = setTimeout(function () {
	                        self.resetDisplayRecordIndex();
	                        self.filterStr = data.filterStr;
	                        self.calculateFilteredRecords(true);
	                        self.diffRecords();
	                    }, 150);
	                }
	                break;
	            }
	        case 'updateSingle':
	            {
	                self.updateSingle(data.data);
	                if (self.refreshing) {
	                    self.diffRecords();
	                } else {
	                    self.checkNewRecordsTip();
	                }
	                break;
	            }

	        case 'updateMultiple':
	            {
	                self.updateMultiple(data.data);
	                if (self.refreshing) {
	                    self.diffRecords();
	                } else {
	                    self.checkNewRecordsTip();
	                }
	                break;
	            }
	        case 'initRecord':
	            {
	                recordList = data.data;
	                self.calculateFilteredRecords(true);
	                self.diffRecords();
	                break;
	            }

	        case 'clear':
	            {
	                recordList = [];
	                self.calculateFilteredRecords(true);
	                self.diffRecords();
	                break;
	            }

	        case 'loadMore':
	            {
	                if (self.IN_DIFF) {
	                    return;
	                }
	                self.refreshing = false;
	                if (data.data > 0) {
	                    self.endIndex += data.data;
	                } else {
	                    self.beginIndex = Math.max(self.beginIndex + data.data, 0);
	                }
	                self.diffRecords();
	            }

	        case 'updateRefreshing':
	            {
	                if (typeof data.refreshing === 'boolean') {
	                    self.refreshing = data.refreshing;
	                    if (self.refreshing) {
	                        self.diffRecords();
	                    }
	                }
	            }
	    }
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(2), __esModule: true };

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var core  = __webpack_require__(3)
	  , $JSON = core.JSON || (core.JSON = {stringify: JSON.stringify});
	module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
	  return $JSON.stringify.apply($JSON, arguments);
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ }
/******/ ]);