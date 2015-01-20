/**
 * Created by yuuu on 14/12/22.
 */
var width = 550;
var height = 400;
var radius = Math.min(width, height) / 2;
var target;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 75, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = d3.scale.category20c();
var vis, partition, arc;

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

function e2d3Show(){
    e2d3.bind2Json(e2d3BindId, { dimension: '2d' }, show);
}
function e2d3Update(){

}

function show(data) {
    var head = [];
    var labels = [];
    var targets = [];
    var label_len = 1;
    var labelList = [];

    data[0].forEach(function (d, i) {
        head.push(i);
    })
    data.forEach(function (d, i) {
        var len = d.filter(function (e, k) {
            if (!isFinite(e) && e !== "") return true;
        });
        if (len.length > label_len) label_len = len.length;
        len.forEach(function (v, j) {
            if ($.inArray(d[v], labelList) !== -1) labelList.push(d[v]);
        });
        
    });

    head.forEach(function (dd, k) {
        if (k < label_len) {
            labels.push(dd);
        } else {
            targets.push(dd);
        }
    });

    // Various accessors that specify the four dimensions of data to visualize.
    function x(d) { if (d[head[1]]) return d[head[1]]; }
    function y(d) { /* return d.lifeExpectancy; */ }
    function radius(d) { if (d[head[1]]) return d[head[1]]; }
    function color(d) { if (d[head[1]]) return d[head[1]]; }
    function key(d) { return d[head[0]]; }

    // Chart dimensions.
    var margin = { top: 10.5, right: 10.5, bottom: 10.5, left: 39.5 },
        width = 550 - margin.right,
        height = 450 - margin.top - margin.bottom;

    // Various scales. These domains make assumptions of data, naturally.
    var xScale = d3.scale.log().domain([300, 1e5]).range([0, width]),
        yScale = d3.scale.linear().domain([10, 85]).range([height, 0]),
        radiusScale = d3.scale.sqrt().domain([0, 5e8]).range([0, 40]),
        colorScale = d3.scale.category10();

    // The x & y axes.
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Create the SVG container and set the origin.
    var svg = d3.select("#e2d3-chart-area").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("income per capita, inflation-adjusted (dollars)");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("life expectancy (years)");

    // Add the year label; the value is set on transition.
    var label = svg.append("text")
        .attr("class", "year label")
        .attr("text-anchor", "end")
        .attr("y", height - 24)
        .attr("x", width)
        .text(1800);

    // Load the data.
    //d3.json("nations.json", function(nations) {
    var nations = [];
    var names = d3.set(data.map(function (d) { return d[head[0]]; })).values();
    var types = d3.set(data.map(function (d) { return d[head[1]]; })).values();
    names.forEach(function (nation) {
        var tmp = data.filter(function (d) { return d[head[0]] === nation; });
        var obj = { name: nation, region: tmp[0][1] };
        types.forEach(function (type) {
            var row = tmp.filter(function (d) { return d[head[1]] === type; })[0];
            var years = targets;
            var coords = [];
            years.forEach(function (year) {
                if (row[year] !== '-') {
                    coords.push([+year, +row[year]]);
                }
            });
            obj[type] = coords;
        });
        nations.push(obj);
    });


    // A bisector since many nation's data is sparsely-defined.
    var bisect = d3.bisector(function (d) { return d[0]; });

    // Add a dot per nation. Initialize the data at 1800, and set the colors.
    var dot = svg.append("g")
        .attr("class", "dots")
      .selectAll(".dot")
        .data(interpolateData(targets[0]))
      .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function (d) { return colorScale(d[head[0]]); })
        .call(position)
        .sort(order);

    // Add a title.
    dot.append("title")
        .text(function (d) { return d[0]; });

    // Add an overlay for the year label.
    var box = label.node().getBBox();

    var overlay = svg.append("rect")
          .attr("class", "overlay")
          .attr("x", box.x)
          .attr("y", box.y)
          .attr("width", box.width)
          .attr("height", box.height)
          .on("mouseover", enableInteraction);

    // Start a transition that interpolates the data based on year.
    svg.transition()
        .duration(30000)
        .ease("linear")
        .tween("year", tweenYear)
        .each("end", enableInteraction);

    // Positions the dots based on data.
    function position(dot) {
        dot.attr("cx", function (d) { return xScale(x(d)); })
            .attr("cy", function (d) { return yScale(y(d)); })
            .attr("r", function (d) { return radiusScale(radius(d)); });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
        return radius(b) - radius(a);
    }

    // After the transition finishes, you can mouseover to change the year.
    function enableInteraction() {
        var yearScale = d3.scale.linear()
            .domain([1800, 2009])
            .range([box.x + 10, box.x + box.width - 10])
            .clamp(true);

        // Cancel the current transition, if any.
        svg.transition().duration(0);

        overlay
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            label.classed("active", true);
        }

        function mouseout() {
            label.classed("active", false);
        }

        function mousemove() {
            displayYear(yearScale.invert(d3.mouse(this)[0]));
        }
    }

    // Tweens the entire chart by first tweening the year, and then the data.
    // For the interpolated data, the dots and label are redrawn.
    function tweenYear() {
        var year = d3.interpolateNumber(1800, 2009);
        return function (t) { displayYear(year(t)); };
    }

    // Updates the display to show the specified year.
    function displayYear(year) {
        dot.data(interpolateData(year), key).call(position).sort(order);
        label.text(Math.round(year));
    }

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(year) {
        return nations.map(function (d) {
            return {
                name: d.name,
                region: d.region,
                income: interpolateValues(d.income, year),
                population: interpolateValues(d.population, year),
                lifeExpectancy: interpolateValues(d.lifeExpectancy, year)
            };
        });
    }

    // Finds (and possibly interpolates) the value for the specified year.
    function interpolateValues(values, year) {
        var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
        if (i > 0) {
            var b = values[i - 1],
                t = (year - a[0]) / (b[0] - a[0]);
            return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
    }
};