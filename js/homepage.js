d3.json("/get_timeline_data", {
    method: "POST",
    body: JSON.stringify({
        date: Date.now(),
    })
}).then((data) => {
    console.log(data)
    DrawTimeLine(data["ProductionData"], data["DowntimeData"], data["PowerOffData"], data);
}).catch((error) => {
    console.error("Error loading the data: " + error);
});

function DrawTimeLine(productionDataset, downtimeDataset, powerOffDataset, data) {
    // access data
    const xAccessor = d => d["Date"]
    const yAccessor = d => d["Value"]

    //set dimensions
    let dimensions = {
        width: screen.width - 500,
        height: 100,
        margin: {top: 0, right: 40, bottom: 20, left: 40,},
    }
    //draw canvas
    const wrapper = d3.select("#timeline")
        .append("svg")
        .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.height)
    const bounds = wrapper.append("g")


    //set scales
    const chartStartsAt = productionDataset[0]["Date"]
    const chartEndsAt = productionDataset[productionDataset.length - 1]["Date"]
    const xScale = d3.scaleTime()
        .domain([chartStartsAt, chartEndsAt])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    const yScale = d3.scaleLinear()
        .domain(d3.extent(productionDataset, yAccessor))
        .range([dimensions.height - dimensions.margin.bottom, 0])


    // prepare data
    const productionAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);
    const downtimeAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);
    const powerOffAreaGenerator = d3.area()
        .x(d => xScale(xAccessor(d)))
        .y0(dimensions.height - dimensions.margin.bottom)
        .y1(d => yScale(yAccessor(d)))
        .curve(d3.curveStepAfter);

    // prepare tooltip
    let div = d3.select("#timeline").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0.7)
        .style("visibility", "hidden");
    const timeScale = d3.scaleTime()
        .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    bounds.append("g")
        .attr("transform", "translate(0," + (dimensions.height - dimensions.margin.bottom) + ")")
        .call(d3.axisBottom(timeScale))

    // draw data with tooltip
    bounds.append("path")
        .attr("d", productionAreaGenerator(productionDataset))
        .attr("fill", "green")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(productionDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(productionDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>Production<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.transition()
                div.style("visibility", "hidden")
            }
        )
    bounds.append("path")
        .attr("d", downtimeAreaGenerator(downtimeDataset))
        .attr("fill", "orange")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(downtimeDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(downtimeDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>Downtime<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.style("visibility", "hidden")
            }
        )
    bounds.append("path")
        .attr("d", powerOffAreaGenerator(powerOffDataset))
        .attr("fill", "red")
        .on('mousemove', (event) => {
                let coords = d3.pointer(event);
                let timeEntered = timeScale.invert(coords[0]) / 1000
                let now = new Date(timeEntered * 1000).toLocaleString()
                let start = new Date(powerOffDataset.filter(i => i["Date"] < timeEntered).pop()["Date"] * 1000).toLocaleString()
                let end = new Date(powerOffDataset.filter(i => i["Date"] > timeEntered)[0]["Date"] * 1000).toLocaleString()
                div.html(now + "<br/>PowerOff<br/>" + start + "<br/>" + end)
                    .style("visibility", "visible")
                    .style("top", (event.pageY) - 60 + "px")
                    .style("left", (event.pageX) - 60 + "px")
            }
        )
        .on('mouseout', () => {
                div.style("visibility", "hidden")
            }
        )
}