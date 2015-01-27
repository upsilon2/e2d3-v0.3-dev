/**
 * Created by yuuu on 14/12/22.
 */

$(document).ready(function () {


});
var width = 500;
var height = 500;

var svg = d3.select("#e2d3-chart-area").append("svg")
    .attr("width", width)
    .attr("height", height);

var projection = d3.geo.mercator()
    .center([136, 38])
    .scale(1200)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .attr("class","chart-tooltip");

var topo = {};
var colorButtons = $('<div>').attr('id', 'chart-color-selector');
var buttonBrue = $('<button>').addClass('btn red chart-color-selector-button').attr({
    'data-color-min': '#FEFFD1',
    'data-color-max': '#FF0000'
});
var buttonRed = $('<button>').addClass('btn blue chart-color-selector-button').attr({
    'data-color-min': '#C9FDFF',
    'data-color-max': '#0000FF'
});
var buttonMix = $('<button>').addClass('btn multi chart-color-selector-button').attr({
    'data-color-min': '#0000FF',
    'data-color-max': '#FF0000'
});
function e2d3Show(){

    console.log("Begin e2d3Show.");
    jQuery('#chart-labels').remove();
    $(colorButtons).append([buttonBrue, buttonRed, buttonMix]);
    $('#e2d3-chart-area').append(colorButtons);
    $.getScript( baseUrl + "/topojson.v1.6.js",function(){
        //
        //$("svg").empty();
        d3.json("json/geo/japan.topojson", function (error, o) {
            //console.log(o);
            svg.selectAll(".states")
                .data(topojson.feature(o, o.objects.japan).features)
                .enter().append("path")
                .attr("stroke", "gray")
                .attr("stroke-width", "0.5")
                .attr("id", function(d) {return "state_" + d.properties.id; })
                .attr("class", 'states')
                .attr("fill","#fff")
                .attr("d", path);
            topo = o;
            e2d3.addChangeEvent(e2d3BindId, e2d3Update, function () {
                e2d3.bind2Json(e2d3BindId, { dimension: '3d' }, show);
            });
            
        });

    });


}
function e2d3Update(responce) {
    console.log("e2d3Update :" + responce);
    dataUpdate(responce);
}

function show(data) {
    console.log('show');
    if (data && topo.objects) {
        //max and slider labels
        var labels = [];
        var values = []; // all of data;
        var data_row = 0;
        for (i in data) if (data.hasOwnProperty(i)) {
            var d = data[i];
            for (k in d) if (d.hasOwnProperty(k)) {

                if (d[k] !== i && data_row !== 0) {
                    values.push(d[k]);
                } else if (d[k] !== i && data_row === 0) {
                    labels.push(k);
                    values.push(d[k]);
                }
            }
            data_row++;
        }
        //slider
        var initLabel = '';
        var hasActive = false;
        jQuery('.chart-label').each(function () {
            if (jQuery(this).hasClass('active')) {
                initLabel = jQuery(this).attr('data-chart-label');
                if ($.inArray(initLabel, labels) === -1) {
                    initLabel = '';
                } else {
                    hasActive = true;
                }
            }
        });
        //color
        var colorSelector = jQuery('.chart-color-selector-button');
        var selectedColor = '';
        jQuery(colorSelector).each(function () {
            if (jQuery(this).hasClass('active')) {
                selectedColor = this;
            }
        });
        if (!selectedColor) {
            selectedColor = colorSelector[0];
            jQuery(colorSelector[0]).addClass('active');
        }

        console.log('hasActive : '+hasActive);
        if (!initLabel) {
            initLabel = labels[0];
        }

        svg.selectAll(".states")
            .data(topojson.feature(topo, topo.objects.japan).features)
            .on('mouseover', function () { return tooltip.style("visibility", "visible"); })
            .on('mousemove', function (d) {
                var inner = '';
                var noValue = true;
                labels.forEach(function (label, i) {
                    var isActive = (label != initLabel) ? '' : 'active';

                    inner += '<dt class="' + isActive + '">' + label + '</dt><dd class="' + isActive + '">';
                    if(data[d.properties.nam_ja] && data[d.properties.nam_ja][label]){
                        inner += data[d.properties.nam_ja][label];
                        noValue = false;
                    }else{
                        inner += '0';
                    }
                    inner += '</dd>';
                })
                if (!noValue) {
                    return tooltip
                        .style("top", (d3.event.pageY - 10) + "px")
                        .style("left",(d3.event.pageX + 10)+"px")
                        .html('<h4>' + d.properties.nam_ja + '</h4><dl class="dl-horizontal">' + inner);
                }
            })
            .on('mouseout', function () { return tooltip.style("visibility", "hidden"); })
            .transition()
            .attr("fill", function (d) {
                return (data[d.properties.nam_ja] && data[d.properties.nam_ja][initLabel] && !isNaN(+data[d.properties.nam_ja][initLabel])) ? color(data[d.properties.nam_ja][initLabel], values, selectedColor) : "#ffffff";
            });

        if (!hasActive) {
            makeLabels(labels, initLabel);
        }
        //onchange label
        jQuery(document).on('click', '.chart-label', function () {
            jQuery('.chart-label').removeClass('active');
            jQuery(this).addClass('active');

            initLabel = jQuery(this).attr('data-chart-label');
            console.log('label change : ' + initLabel);
            svg.selectAll(".states")
                .data(topojson.feature(topo, topo.objects.japan).features)
                .on('mouseover', function () { return tooltip.style("visibility", "visible"); })
                .on('mousemove', function (d) {
                    var inner = '';
                    var noValue = true;
                    labels.forEach(function (label, i) {
                        var isActive = (label != initLabel) ? '' : 'active';

                        inner += '<dl class="dl-horizontal"><dt class="' + isActive + '">' + label + '</dt><dd class="' + isActive + '">';
                        if (data[d.properties.nam_ja] && data[d.properties.nam_ja][label]) {
                            inner += data[d.properties.nam_ja][label];
                            noValue = false;
                        } else {
                            inner += '0';
                        }
                        inner += '</dd>';
                    })
                    if (!noValue) {
                        return tooltip
                            .style("top", (d3.event.pageY - 10) + "px")
                            .style("left", (d3.event.pageX + 10) + "px")
                            .html('<h4>' + d.properties.nam_ja + '</h4><dl class="dl-horizontal">' + inner);
                    }
                })
                .on('mouseout', function () { return tooltip.style("visibility", "hidden"); })
                .transition()
                .attr("fill", function (d) {
                    return (data[d.properties.nam_ja] && data[d.properties.nam_ja][initLabel] && !isNaN(+data[d.properties.nam_ja][initLabel])) ? color(data[d.properties.nam_ja][initLabel], values, selectedColor) : "#ffffff";
                });
        });
        //change color
        jQuery(document).on('click', '.chart-color-selector-button', function () {
            jQuery('.chart-color-selector-button').removeClass('active');
            jQuery(this).addClass('active');
            console.log('color change : ');
            selectedColor = this;

            svg.selectAll(".states")
                .data(topojson.feature(topo, topo.objects.japan).features)
                .transition()
                .attr("fill", function (d) {
                    return (data[d.properties.nam_ja] && data[d.properties.nam_ja][initLabel] && !isNaN(+data[d.properties.nam_ja][initLabel])) ? color(data[d.properties.nam_ja][initLabel], values, selectedColor) : "#ffffff"
                });
        });
    }
}
function dataUpdate(response) {
    console.log(response);
    if (response) {
        e2d3.bind2Json(e2d3BindId, { dimension: '3d' }, show);
    }
}
function makeLabels(labels, value) {
    jQuery('#chart-labels').remove();
    var box = jQuery('<div>').attr('id','chart-labels');
    jQuery(labels).each(function () {
        var label = jQuery('<label>').addClass('chart-label').attr('data-chart-label',this).html(this);
        if (value == this) {
            jQuery(label).addClass('active');
        }
        jQuery(box).append(label);
    });

    if (labels) {
        jQuery('#e2d3-chart-area').append(box).hide().fadeIn();
    }
}
function color(d, values,selector) {
    if (!selector) {
        var colorSelector = jQuery('.chart-color-selector-button');
        selector = colorSelector[0];
    }
    var min = d3.min(values);
    var max = d3.max(values);
    var c;
    if (!jQuery(selector).hasClass('multi')) {
        c = d3.scale.linear()
            .domain([min, max])
            .range([jQuery(selector).attr('data-color-min'), jQuery(selector).attr('data-color-max')])
            .interpolate(d3.interpolateLab);
    } else {
        c = d3.scale.linear()
            .domain([min, Math.floor((max - min) * 0.5), max])
            .range([jQuery(selector).attr('data-color-min'), '#FEFCEA', jQuery(selector).attr('data-color-max')])
            .interpolate(d3.interpolateLab);
    }

    return c(d);
}