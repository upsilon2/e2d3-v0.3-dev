/**
* E2D3 ver. 0.2 is developed by E2D3 Project Members.
* Especially, all files in this repository are coded by engineers described below.
* However, all rights of all codes are reserved by Yasunobu Igarashi to realize a rapid management.
* And we released E2D3 ver. 0.2 under GNU AFFERO GENERAL PUBLIC LICENSE, Version 3.
* Lisence and Readme file see https://github.com/hipsrinoky/E2D3
* -- 
* Ver 0.2.2
* Lastest update 2014/11/07  Modified by Yu Yamamoto
*/
var e2d3 = (function () {
    'use strict';

    var e2d3 = {};
    /**
    * Initialize 
    *     Must call this function in page. if you need some action, you can callback function.
    */
    e2d3.initialize = function (_callback) {
        Office.initialize = function (reason) {
            if (_callback) _callback(reason);
        };
    };
    /**
    * Set bind data
    * @args object          : [Required] {
    *           id(text)          : unique binding id ( if undifined set count of all binds)
    *           is_prompt(0 | 1)  : 1, show SELECT UI  
    *                               0, not show. shoud be selected cells.
    *        }
    * @callback function    : [Required] if succeeded binding, run callback.
    */
    e2d3.setBindData = function (args, callback) {
        if (!args.id) {
            Office.context.document.bindings.getAllAsync(function (result) {
                args.id = (!result.value) ? 0 : result.value++;
                set(args);
            });
        } else {
            set(args);
        }
        function set(a) {
            console.log('setBindData: Begin set bind:  bindId = ' + a.id);
            if (a.is_prompt) {
                Office.context.document.bindings.addFromPromptAsync(
                Office.BindingType.Matrix,
                a,
                function (result) {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        console.log('setBindData: Success set bind.');
                        return callback(result.value);
                    } else {
                        if (result.error) {
                            showError('setBindData Error: ' + result.error.name + ':' + result.error.message, 'danger');
                        }
                        return callback(false);
                    }
                });
            } else {
                Office.context.document.bindings.addFromSelectionAsync(
                Office.BindingType.Matrix,
                a,
                function (result) {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        console.log('setBindData: Success set bind( not prompt mode ).');
                        return callback(result.value);
                    } else {
                        if (result.error) {
                            showError('setBindData Error: ' + result.error.name + ':' + result.error.message, 'danger');
                        }
                        return callback(false);
                    }
                });
            }
        }
    };
    /**
    * Get bind by id
    */
    e2d3.getBindDataById = function (id,callback) {
        Office.context.document.bindings.getByIdAsync(id, function (result) {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                console.log('getBindDataById: Success get bind');
                return callback(result.value);
            }else{
                return callback(false);
            }
        });
        return false;
    };
    /**
    * get all bind
    */
    e2d3.getAllBindData = function (callback) {
        Office.context.document.bindings.getAllAsync(
             function (result) {
                 if (result.status === Office.AsyncResultStatus.Succeeded) {
                     return callback(result.value);
                 } else {
                     if (result.error) {
                         showError('Error: ' + result.error.name + ':' + result.error.message, 'danger');
                     }
                 }
             });
    };
    /**
    * add change method
    */
    e2d3.addChangeEvent = function (binding, handler, _callback) {
        console.log("addChangeEvent: Set change event :" + binding);
        if(typeof binding == 'string'){
            Office.context.document.bindings.getByIdAsync(binding, function (result) {
                //if same name.
                result.value.removeHandlerAsync(Office.EventType.BindingDataChanged, { handler: handler }, function (remove) {
                    console.log("removeChangeEvent: is String mode");
                    console.log(remove.status);
                    result.value.addHandlerAsync(Office.EventType.BindingDataChanged, handler, function (add) {
                        console.log("addChangeEvent : " + add.status);
                        if (add.status == 'succeeded') {
                            return _callback(true);
                        } else {
                            return _callback(false);
                        }
                    });
                });

            });
        } else {
            //is same name
            binding.removeHandlerAsync(Office.EventType.BindingDataChanged, { handler: handler }, function () {
                binding.addHandlerAsync(Office.EventType.BindingDataChanged, handler, function (add) {
                    if (add.status == 'succeeded') {
                        return _callback(true);
                    } else {
                        return _callback(false);
                    }
                });
            });
        }
    };
    e2d3.removeChangeEvent = function (bindId, handler, callback) {
        console.log("Begin remove change event");
        Office.context.document.bindings.getByIdAsync(bindId, function (result) {
            //if same name.
            result.value.removeHandlerAsync(Office.EventType.BindingDataChanged, { handler: handler }, callback);
        });
    }
    

    /**
    * Excel To Json
    * @bindId               : [Required] target bind id.
    * @args object          : [Required] {
    *           dimension(1d|2d|3d) : format of data matrix. see documents.
    *        }
    * @callback function    : [Required] if succeeded conversion, return converted json data in callback function.
    */
    e2d3.bind2Json = function (bindId, args, callback) {
        console.log('bind2Json: bindId = ' + bindId);
        console.log('bind2Json: dimension = ' + args.dimension);
        
        var valueFormtat = (args.is_formatted) ? Office.ValueFormat.Formatted :  Office.ValueFormat.Unformatted;
        
        Office.context.document.bindings.getByIdAsync(bindId, function (result) {
            console.log(result);
            if (result.status === Office.AsyncResultStatus.Succeeded) {
                
                result.value.getDataAsync(
                { valueFormat: valueFormtat },
                function (result) {

                    if (args.dimension === '1d') {
                        var arr = new Array();
                        var header = new Array();
                        var data = new Array();
                        for (var i = 0; i <= result.value.length; i++) {
                            if (result.value[i]) {
                                arr[i] = result.value[i][0];
                            }
                        }
                        if (!String(arr[0]).match(/\d+/)) {
                            for (var i = 0; i <= arr.length; i++) {
                                console.log('bind2json: 1d dimension loop i(not num) = ' + i);
                                if (i != 0) {
                                    console.log('bind2json: i is not num');
                                    data[arr[0]][i - 1] = arr[i];
                                }
                                console.log('data => ');
                                console.log(data);
                                return callback(data);
                            }
                        } else {
                            return callback(arr);
                        }
                    } else if (args.dimension == '2d') {
                        var arr = result.value;
                        //console.log('bind2json: 2D dimension before value.length = ' + arr.length + ', value = ' + arr);

                        var head = arr[0];
                        var data = [];
                        arr.slice(1).forEach(function (d) {
                            var tmp = {};
                            head.forEach(function (dd, i) {
                                tmp[dd] = d[i];
                            });
                            data.push(tmp);
                        });
                        //var head = new Object;
                        //var text = '[';
                        //arr.map(function (d, i) {

                        //    //console.log(text);
                        //    if (i == 0) {
                        //        head = d;
                        //    } else {
                        //        text += "{";
                        //        var value = new Array();
                        //        d.map(function (v, j) {
                        //            value[j] = '"' + head[j] + '":"' + v + '"';
                        //        });
                        //        text += value.join(",") + "}";

                        //        if (i < arr.length - 1) {
                        //            text += ",";
                        //        }
                        //    }
                        //});
                            
                        //text += "]";
                        //var data = JSON.parse(text);
                        //console.log('bind2json: 2D dimension data.length = ' + data.length + ', data = ' + data);
                        return callback(data);
                    } else if (args.dimension == '3d') {
                        var arr = result.value;
                        
                        var head = arr[0];
                        var data = {};
                        arr.slice(1).forEach(function (d) {
                            var tmp = {};
                            head.forEach(function (dd,i) {
                                tmp[dd] = d[i];
                            });
                            data[d[0]] = tmp;
                        });
                        return callback(data);
                    } else if (args.dimension == 'nested') {
                        var arr = result.value,
                            head = arr[0],
                            labels = [],
                            targets = [],
                            data = {},
                            root = { "key": "root", "label": "root", "children": [] },
                            label_len = 1, is_double = false,
                            values = [];
                        arr.slice(1).forEach(function (d, i) {
                            //
                            var len = d.filter(function (e, k) {
                                if (!isFinite(e) && e !== "" && e.replace(/[_!"#$%&'()=~|{`@/\[\]., 　\t\r…]*/, '')) return true;
                            });
                            if (len.length > label_len) label_len = len.length;
                            if (i !== 0 && arr[i - 1][0] === d[0]) is_double = true;
                            //
                            var value = {};
                            head.forEach(function (dd, k) { value[dd] = d[k]; });
                            values[i] = value;
                        });
                        head.forEach(function (dd, k) {
                            if (k < label_len) {
                                labels.push(dd);
                            } else {
                                targets.push(dd);
                            }
                        });

                        for (var i = 1; i < arr.length; i++) {
                            var value = values[i - 1];
                            var parts = [];
                            for (var n = 0; n < label_len; n++) {
                                if (arr[i][n]) parts.push(arr[i][n]);
                            }
                            //
                            var currentNode = root;
                            for (var j = 0; j < parts.length; j++) {
                                var children = currentNode["children"];
                                var nodeKey = head[j];
                                var nodeLabel = parts[j];
                                var childNode;
                                if (j + 1 < parts.length) {
                                    // Not yet at the end of the sequence; move down the tree.
                                    var foundChild = false;
                                    if (children) {
                                        for (var k = 0; k < children.length; k++) {
                                            if (children[k]["label"] == nodeLabel) {
                                                childNode = children[k];
                                                foundChild = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (!foundChild) {
                                        childNode = { "key": nodeKey, "label": nodeLabel, "children": [] };
                                        children.push(childNode);
                                    }
                                    currentNode = childNode;

                                } else {
                                    childNode = { "key": nodeKey, "label": nodeLabel, "values": value };
                                    children.push(childNode);
                                }
                            }
                        }
                        data = {
                            header: head,
                            labels: labels,
                            targets: targets,
                            data: root
                        }
                        
                        return callback(data);
                    }
                    else {
                        //normal array
                        console.log("bind2Json : not dimension mode");
                        return callback(result.value);
                    }
                });
            } else {
                if (result.error) {
                    showError('bind2Json Error: ' + result.error.name + ':' + result.error.message, {color: "danger"});
                }
                callback(false);
            }

        });

    };

    /**
    * Office style json set cells.
    * @json                 : [Required] target json that is simple array like "[[a,b,c],[x,y,z]...]"
    * @callback function    : [Required] if succeeded conversion and set data at cells, return binding object in callback.
    * 
    * *Caution : This function convert json AND set data to cells. Return boolean.
    */
    e2d3.json2Excel = function (json, callback) {
        //console.log('json2Excel: json = ' + json);
        Office.context.document.setSelectedDataAsync(json,
            { coercionType: Office.CoercionType.Matrix },
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    return callback(true);
                } else {
                    if (result.error) {
                        showError('Error: ' + result.error.name + ':' + result.error.message, 'danger');
                    }
                    callback(false);
                }
            });
    };
    /**
    * Multi dimension json set cells.
    * @json                 : [Required] target json that is multi dimensional object. specify format in args parameter.
    * @args object          : [Required] {
    *           dimension(1d|2d|3d) : format of data matrix. see documents.
    *        }
    * @callback function    : [Required] if succeeded conversion and set data at cells, return binding object in callback.
    * 
    * *Caution : This function convert json AND set data to cells. Return boolean.
    */
    e2d3.trimmedJson2Excel = function (json, args, callback) {

        var data = new Array();
        if (!Array.isArray(json)) {
            if (args.dimension === '1d') {
                //for (var i = 0; i <= json.length; i++) {
                //    if (json[i]) data[i] = [json[i]];
                //}
            } else if (args.dimension === '2d') {
                var c = 1;
                json.forEach(function (d, i) {
                    var r = [];
                    if (i == 0) {
                        //make header
                        var h = [], hc = 0;
                        for (var j in d) if (d.hasOwnProperty(j)) {
                            h[hc] = j; r[hc] = d[j];
                            hc++;
                        }
                        data[0] = h;
                        data[c] = r;
                    } else {
                        var rc = 0;
                        for (var j in d)  if (d.hasOwnProperty(j)) {
                            r[rc] = d[j];
                            rc++;
                        }
                        data[c] = r;
                    }
                    c++;
                });
            } else if (args.dimension === '3d') {
                
            }
        }
       
        console.log('trimedJson2Excel: data = ' + data);
        var response;
        if (data.length > 0) {
            Office.context.document.setSelectedDataAsync(data,
            function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    response = true;
                } else {
                    if (result.error) {
                        showError('Error: ' + result.error.name + ':' + result.error.message, 'danger');
                    }
                    response = false;
                }
            });
        } else {
            showError('Posted data not available.', 'danger');
            response = false;
        }
        callback(response);
        
    };
    /**
    * Release Binding Data By id
    **/
    e2d3.releaseBindDataById = function (args, callback) {
        if (!args.id) {
            return false;
        }
        if (args.isDataDelete) {
            Office.context.document.bindings.getByIdAsync(args.id, function (resultGet) {
                if (resultGet.status === Office.AsyncResultStatus.Succeeded) {
                    var binding = resultGet.value; // include row and col count

                    //Don't use removeHandlerAsync. Because "Office.EventType.BindingDataChanged" parameter is faild.
                    //remove change handler
                    //Office.select("bindings#" + args.id).removeHandlerAsync();
                    //binding.removeHandlerAsync(Office.EventType.BindingDataChanged, function (resultChange) {
                    //    if (resultChange.status === Office.AsyncResultStatus.Succeeded) {
                    //        createData(args, binding);
                    //    } else {
                    //        showError(resultChange.error.name + resultChange.error.message, 'error');
                    //    }

                    //});
                    createData(args, binding);
                } else {
                    if (resultGet.error) {
                        //showError(resultGet.error.name + resultGet.error.message, 'danger');
                    }
                    deleteData(args);
                }

            });
        } else {
            deleteData(args);
        }
        /**
        * Create "" value array.
        */
        function createData(args, binding) {
            var data = [];
            for (var i = 0; i <= binding.rowCount - 1; i++) {
                var col = [];
                for (var j = 0; j <= binding.columnCount - 1; j++) {
                    col[j] = '';
                }
                data[i] = col;
            }
            //console.log(data);
            Office.context.document.setSelectedDataAsync(data,
                function (result) {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {

                    } else {
                        if (result.error) {
                            //showError('Error: ' + result.error.name + ':' + result.error.message, 'danger');
                        }
                    }
                });
            deleteData(args);
        }
        /**
        * Set "" value data.
        */
        function deleteData(args) {
            Office.context.document.bindings.releaseByIdAsync(args.id, function (result) {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    callback(true);
                } else {
                    if (result.error) {
                        //showError('Error: ' + result.error.name + ':' + result.error.message, 'danger');
                    }
                    callback(false);
                }
            });
        }
    };
    e2d3.dateObjecter = function (str) {
        var y = '', m = '', d = '';
        var month = { "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6, "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12 };
        //console.log(str);
        if (new Date(str) != "Invalid Date") {
            return new Date(str);
        } else if (str.match(/[年月日]/)) {
            //日本語の場合
            y = (y = str.match(/[0-2][0-9][0-9][0-9]年|[0-9][0-9]年/)) ? y[0].replace(/年/, ''): '';
            m = (m = str.match(/[0-1]?[0-9]月/)) ? m[0].replace(/月/, '') : '1';
            d = (d = str.match(/[0-3]?[0-9]日/)) ? d[0].replace(/日/, '') : '1';
            if (y) return new Date(y, m - 1, d);
            

        } else if (str.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)) {
            y = (y = str.match(/\b[0-2][0-9][0-9][0-9]\b|\b[0-9][0-9]\b/)) ? y[0] : '';
            m = (m = str.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)) ? month[m[0]] : '1';
            d = (d = str.match(/\b[0-3]?[0-9]\b/)) ? d[0] : '1';
            if (y) return new Date(y, m - 1, d);

        } else if (str.match(/[0-2][0-9][0-9][0-9]\/[0-1]?[0-9]\/[0-3]?[0-9]/)) {
            var day = str.split('/');
            day.forEach(function (v, i) {
                if (d.match(/\b[0-2][0-9][0-9][0-9]\b|\b[0-9][0-9]\b/)) {
                    y = v;
                } else if (d.match(/[0-1]?[0-9]/)) {
                    m = v;
                } else if (d.match(/\b[0-3]?[0-9]\b/)) {
                    d = v;
                }
            });
            if (!m) m = 1;
            if (!d) d = 1;
            if (y) return new Date(y, m - 1, d);

        } else if (str.match(/\b[0-2][0-9][0-9][0-9]\b/)) {
            y = str.match(/\b[0-2][0-9][0-9][0-9]\b/);
            if (y) return new Date(y[0]);
        }
        return false;
    }

    return e2d3;
})();

/**
* For Debug. Show objects
* * Caution! Need jQuery.
*/
function showObj(obj, s) {

    var _box;
    if (!_box) {
        _box = $("body");
    }
    if (!s) s = 0;

    var row = 0;
    $(obj).each(function (i) {
        //if (s == 0) {
        //    console.log(this);
        //}
        console.log(this);
        $(_box).append($("<div>").html("[" + row + "] <strong>" + i + "</strong> = " + this).css("margin-left", function () { return (s * 10) + 'px' }));

        row++;
    });
}
/**
* For Debug. Show objects
* Caution! Need jQuery.
*/
function showError(message, _type) {
    console.log(message);
    if (!_type.color) {
        _type.color = 'info';
    }
    var alert = $("<div>").addClass('e2d3-alert p6 alert alert-' + _type.color).html(message).hide();
    $("#e2d3-chart-area").prepend(alert);

    
    $(alert).fadeIn(400, function () {
        if (!_type.stay) {
            $(alert).delay(4000).fadeOut(600, function () {
                $(alert).remove();
            });
        }
    });
    
    
}

function lookdeep(object) {
    var collection = [], index = 0, next, item;
    for (item in object) {
        if (object.hasOwnProperty(item)) {
            next = object[item];
            if (typeof next == 'object' && next != null) {
                collection[index++] = item +
                ':{ ' + lookdeep(next).join(', ') + '}';
            }
            else collection[index++] = [item + ':' + String(next)];
        }
    }
    return collection;
}