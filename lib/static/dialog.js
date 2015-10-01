/* Copyright (c) 2015 Paul McKay
 *
 * This file is part of the 'dry-layers' package for Node.js and is subject to
 * the terms of the MIT License.  If a copy of the license was not distributed 
 * with this file, you can get one at:
 * https://raw.githubusercontent.com/pmckay/dry-layers/master/LICENSE. 
 */

function Dialog(id) {
    
    var self = {};
       
    var getArrayName = function (name) {
        var index = name.indexOf("[]");
        if (index <= -1) {
            return null;
        }
        if (index + 2 < name.length) {
            return null;
        }
        return name.substr(0, index);
    }
    
    self.getData = function () {
        var data = {}
        $(id + ' input').each(function () {
            if (this.name) {
                var arrayName = getArrayName(this.name);
                if (arrayName) {
                    if (!data[arrayName]) {
                        data[arrayName] = [];
                    }
                    if ($(this).prop("checked")) {
                        data[arrayName].push($(this).val());
                    }
                }
                else {
                    data[this.name] = $(this).val();
                }
            }
        });
        $(id + ' select').each(function () {
            if (this.name) {
                data[this.name] = $(this).val();
            }
        });
        return data;
    }
    
    self.id = id;

    self.load = function (callback) {
        callback();
    }
    
    self.modal = function (handler) {
        
        var result;
        
        $(id + ' ' + 'button').click(function () {
            result = $(this).val();
        });
        
        $(id).one('hidden.bs.modal', function () {
            handler(result);
        });

        $(id).modal();

    }
    
    self.resetData = function (data) {
        $(id + ' input').each(function () {
            var arrayName = getArrayName(this.name);
            if (arrayName) {
                $(this).prop("checked", false);
            }
            else {
                $(this).val('');
            }
        });
    }
    
    self.setData = function (data) {
        $(id + ' input').each(function () {
            if (this.name) {
                var arrayName = getArrayName(this.name);
                if (arrayName) {
                    var checked = (-1 < $.inArray($(this).val(), data[arrayName]));
                    $(this).prop("checked", checked);
                }
                else {
                    $(this).val(data[this.name]);
                }
            }
        });
        $(id + ' select').each(function () {
            if (this.name) {
                $(this).val(data[this.name]);
            }
        });
    }

    return self;

}

function DataDialog(type) {

    var id = '#' + type + '-dialog';
    
    base = Dialog(id);
    
    self = base;

    return self;
}

