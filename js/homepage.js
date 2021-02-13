d3.json("/get_timeline_data", {
    method: "POST",
    body: JSON.stringify({
        date: Date.now(),
    })
}).then((data) => {
    DrawTimeLine(data["ProductionData"], data["DowntimeData"]);
    DrawTimeLinePanel(data["ProductionData"], data["DowntimeData"]);
}).catch((error) => {
    console.error("Error loading the data: " + error);
});


function DrawTimeLinePanel(productionDataset, downtimeDataset) {
    const xAccessor = d => d["Date"]
    const yAccessor = d => d["Value"]
    let dimensionsPanel = {
        width: screen.width - 500,
        height: 40,
        margin: {top: 0, right: 40, bottom: 20, left: 40,},
    }

    const wrapperPanel = d3.select("#timeline-panel")
        .append("svg")
        .attr("viewBox", "0 0 " + dimensionsPanel.width + " " + dimensionsPanel.height)
    const boundsPanel = wrapperPanel.append("g")

    const chartStartsAt = productionDataset[0]["Date"]
    const chartEndsAt = productionDataset[productionDataset.length - 1]["Date"]

    const xScalePanel = d3.scaleTime()
        .domain([chartStartsAt, chartEndsAt])
        .range([dimensionsPanel.margin.left, dimensionsPanel.width - dimensionsPanel.margin.right])
    const yScalePanel = d3.scaleLinear()
        .domain(d3.extent(productionDataset, yAccessor))
        .range([dimensionsPanel.height - dimensionsPanel.margin.bottom, 0])

    const productionAreaGeneratorPanel = d3.area()
        .x(d => xScalePanel(xAccessor(d)))
        .y0(dimensionsPanel.height - dimensionsPanel.margin.bottom)
        .y1(d => yScalePanel(yAccessor(d)))
        .curve(d3.curveStepAfter)
    const downtimeAreaGeneratorPanel = d3.area()
        .x(d => xScalePanel(xAccessor(d)))
        .y0(dimensionsPanel.height - dimensionsPanel.margin.bottom)
        .y1(d => yScalePanel(yAccessor(d)))
        .curve(d3.curveStepAfter);

    const timeScalePanel = d3.scaleTime()
        .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
        .range([dimensionsPanel.margin.left, dimensionsPanel.width - dimensionsPanel.margin.right])
    boundsPanel.append("g")
        .attr("transform", "translate(0," + (dimensionsPanel.height - dimensionsPanel.margin.bottom) + ")")
        .call(d3.axisBottom(timeScalePanel))

    boundsPanel.append("path")
        .attr("d", productionAreaGeneratorPanel(productionDataset))
        .attr("fill", "green")
    boundsPanel.append("path")
        .attr("d", downtimeAreaGeneratorPanel(downtimeDataset))
        .attr("fill", "orange")

    const brush = d3.brushX()
        .extent([[dimensionsPanel.margin.left, 0.5], [dimensionsPanel.width - dimensionsPanel.margin.right, dimensionsPanel.height - dimensionsPanel.margin.bottom + 0.5]])
        .on("brush", updateData)
        .on("end", updateData)

    wrapperPanel.append("g")
        .call(brush)

    function updateData({selection}) {
        if (selection) {
            let startBrush = xScalePanel.invert(selection[0]) / 1000
            let endBrush = xScalePanel.invert(selection[1]) / 1000
            if (selection[0] > 0) {
                document.getElementById("timeline").innerHTML = ""
                let {productionDatasetUpdated, downtimeDatasetUpdated} = updateDatasets(productionDataset, startBrush, endBrush);
                DrawTimeLine(productionDatasetUpdated, downtimeDatasetUpdated);
            }
        }

    }
}

function updateDatasets(productionDataset, startBrush, endBrush) {
    let productionDatasetUpdated
    productionDatasetUpdated = []
    let downtimeDatasetUpdated
    downtimeDatasetUpdated = []
    let startBrushing = true
    let lastValueInBrush = 0
    let lastValueBeforeBrush = 0
    for (const actualElement of productionDataset) {
        if (+(actualElement["Date"] / 1000) < +startBrush) {
            lastValueBeforeBrush = actualElement["Value"]
        } else if ((+(actualElement["Date"] / 1000) >= +startBrush) && (+(actualElement["Date"] / 1000) <= +endBrush)) {
            if (startBrushing) {
                console.log("First value from brush selection, inserting initial data into both datasets, based on actual value")
                if (actualElement["Value"] === 1) {
                    downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 1})
                    productionDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
                    downtimeDatasetUpdated.push({Date: actualElement["Date"], Value: 0})
                    productionDatasetUpdated.push({Date: actualElement["Date"], Value: 1})
                } else {
                    downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
                    productionDatasetUpdated.push({Date: startBrush * 1000, Value: 1})
                    downtimeDatasetUpdated.push({Date: actualElement["Date"], Value: 1})
                    productionDatasetUpdated.push({Date: actualElement["Date"], Value: 0})
                }
                startBrushing = false
            } else {
                console.log("Adding data to new datasets")
                if (actualElement["Value"] === 1) {
                    downtimeDatasetUpdated.push({Date: actualElement["Date"], Value: 0})
                    productionDatasetUpdated.push({Date: actualElement["Date"], Value: 1})
                } else {
                    downtimeDatasetUpdated.push({Date: actualElement["Date"], Value: 1})
                    productionDatasetUpdated.push({Date: actualElement["Date"], Value: 0})
                }
            }
            lastValueInBrush = actualElement["Value"]
        }
    }
    if (productionDatasetUpdated.length > 0) {
        console.log("Closing new dataset with proper value, based on last value in brush selection")
        if (lastValueInBrush === 1) {
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        } else {
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
        }
    } else {
        console.log("No data in brush selection, inserting data based on last value before brush")
        if (lastValueBeforeBrush === 1) {
            productionDatasetUpdated.push({Date: startBrush * 1000, Value: 1})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
            downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
        } else {
            productionDatasetUpdated.push({Date: startBrush * 1000, Value: 0})
            productionDatasetUpdated.push({Date: endBrush * 1000, Value: 1})
            downtimeDatasetUpdated.push({Date: startBrush * 1000, Value: 1})
            downtimeDatasetUpdated.push({Date: endBrush * 1000, Value: 0})
        }
    }
    return {productionDatasetUpdated, downtimeDatasetUpdated};
}


function DrawTimeLine(productionDataset, downtimeDataset) {
    const xAccessor = d => d["Date"]
    const yAccessor = d => d["Value"]

    let dimensions = {
        width: screen.width - 500,
        height: 100,
        margin: {top: 0, right: 40, bottom: 20, left: 40,},
    }
    const wrapper = d3.select("#timeline")
        .append("svg")
        .attr("viewBox", "0 0 " + dimensions.width + " " + dimensions.height)
    const bounds = wrapper.append("g")

    const chartStartsAt = productionDataset[0]["Date"]
    const chartEndsAt = productionDataset[productionDataset.length - 1]["Date"]
    const xScale = d3.scaleTime()
        .domain([chartStartsAt, chartEndsAt])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    const yScale = d3.scaleLinear()
        .domain(d3.extent(productionDataset, yAccessor))
        .range([dimensions.height - dimensions.margin.bottom, 0])

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

    d3.select("#timeline").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0.7)
        .style("visibility", "hidden");
    const timeScale = d3.scaleTime()
        .domain([new Date(chartStartsAt * 1000), new Date(chartEndsAt * 1000)])
        .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])
    bounds.append("g")
        .attr("transform", "translate(0," + (dimensions.height - dimensions.margin.bottom) + ")")
        .call(d3.axisBottom(timeScale))

    bounds.append("path")
        .attr("d", productionAreaGenerator(productionDataset))
        .attr("fill", "green")

    bounds.append("path")
        .attr("d", downtimeAreaGenerator(downtimeDataset))
        .attr("fill", "orange")
}