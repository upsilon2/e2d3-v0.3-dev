
var margin = { top: 10, right: 20, bottom: 6, left: 10 },
    width = windowSize - 30 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.0f"),
    format = function (d) { return formatNumber(d) + " TWh"; },
    color = d3.scale.category20();

var svg;
var sankey;
var path

function e2d3Show(updateFlag) {
    console.log(svg);
    if (updateFlag) {
        console.log("Begin changed");
        e2d3.bind2Json(e2d3BindId, { dimension: '2d' }, show);

    } else {
        console.log("Begin first.");
        $.getScript(baseUrl + "/sankey.js?12345", function () {
            console.log("sanky loaded");
            sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);
            path = sankey.link();

            e2d3.addChangeEvent(e2d3BindId, e2d3Update, function () {
                e2d3.bind2Json(e2d3BindId, { dimension: '2d' }, show);
            });
        });
    }

}
function e2d3Update(responce) {
    console.log("e2d3Update :" + responce);
    e2d3Show(true);
}

function show(data) {
    console.log("start show e");
    $("#e2d3-chart-area").empty();

    if (!data && data.length < 2) {
        return false;
    }

    svg = d3.select('#e2d3-chart-area').append('svg')
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom)
    .style({display: "block" , margin: "0 auto"})
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var energy = { nodes: [], links: [] };
    d3.set(data.map(function (d) { return d.source; }).concat(data.map(function (d) { return d.target; }))).values().forEach(function (d) {
        energy.nodes.push({ name: d, idx: energy.nodes.length });
    });
    data.forEach(function (lnk, i) {
        energy.links.push({ source: energy.nodes.filter(function (d) { return d.name === lnk.source; })[0].idx, target: energy.nodes.filter(function (d) { return d.name === lnk.target; })[0].idx, value: lnk.value });
    });
    sankey
        .nodes(energy.nodes)
        .links(energy.links)
        .layout(32);
    var link = svg.append("g").selectAll(".link")
        .data(energy.links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function (d) { return Math.max(1, d.dy); })
        .sort(function (a, b) { return b.dy - a.dy; });
    link.append("title")
        .text(function (d) { return d.source.name + " ¨ " + d.target.name + "\n" + format(d.value); });

    var node = svg.append("g").selectAll(".node")
        .data(energy.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.behavior.drag()
        .origin(function (d) { return d; })
        .on("dragstart", function () { this.parentNode.appendChild(this); })
        .on("drag", dragmove));

    node.append("rect")
        .attr("height", function (d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function (d) { return d.color = color(d.name.replace(/ .*/, "")); })
        .style("stroke", function (d) { return d3.rgb(d.color).darker(2); })
      .append("title")
        .text(function (d) { return d.name + "\n" + format(d.value); });

    node.append("text")
        .attr("x", -6)
        .attr("y", function (d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) { return d.name; })
      .filter(function (d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    function dragmove(d) {
        d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
        sankey.relayout();
        link.attr("d", path);
    }
    
}
function dataUpdate(response) {
    console.log(response);
    if (response) {
        e2d3.bind2Json(e2d3BindId, { dimension: '2d' }, show);
    }
}