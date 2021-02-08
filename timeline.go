package main

import (
	"encoding/json"
	"github.com/julienschmidt/httprouter"
	"math/rand"
	"net/http"
	"time"
)

type CalendarInput struct {
	Date int64
}

type CalendarOutput struct {
	Result         string
	ProductionData []TimelineData
	DowntimeData   []TimelineData
	PowerOffData   []TimelineData
}

type TimelineData struct {
	Date  int64
	Value int
}

func getTimeLineData(writer http.ResponseWriter, request *http.Request, params httprouter.Params) {
	logInfo("MAIN", "Timeline function called")
	var data CalendarInput
	err := json.NewDecoder(request.Body).Decode(&data)
	if err != nil {
		logError("MAIN", "Error parsing data: "+err.Error())
		var responseData CalendarOutput
		responseData.Result = "nok: " + err.Error()
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(responseData)
		logInfo("MAIN", "Parsing data ended")
		return
	}
	endTime := time.Unix(data.Date/1000, 0)
	var productionData []TimelineData
	var downtimeData []TimelineData
	var powerOffData []TimelineData
	initialTime := endTime.Add(-24 * time.Hour)
	previousState := -1
	for initialTime.Before(endTime) {
		randomState := rand.Intn(3-0) + 0
		randomDuration := rand.Intn(61-1) + 1
		if previousState != randomState {
			switch randomState {
			case 0:
				{
					productionData = append(productionData, TimelineData{Date: initialTime.Unix(), Value: 1})
					downtimeData = append(downtimeData, TimelineData{Date: initialTime.Unix(), Value: 0})
					powerOffData = append(powerOffData, TimelineData{Date: initialTime.Unix(), Value: 0})
				}
			case 1:
				{
					productionData = append(productionData, TimelineData{Date: initialTime.Unix(), Value: 0})
					downtimeData = append(downtimeData, TimelineData{Date: initialTime.Unix(), Value: 1})
					powerOffData = append(powerOffData, TimelineData{Date: initialTime.Unix(), Value: 0})
				}
			case 2:
				{
					productionData = append(productionData, TimelineData{Date: initialTime.Unix(), Value: 0})
					downtimeData = append(downtimeData, TimelineData{Date: initialTime.Unix(), Value: 0})
					powerOffData = append(powerOffData, TimelineData{Date: initialTime.Unix(), Value: 1})
				}
			}
		}
		previousState = randomState
		initialTime = initialTime.Add(time.Duration(randomDuration) * time.Minute)
	}
	productionData = append(productionData, TimelineData{Date: endTime.Unix(), Value: 0})
	downtimeData = append(downtimeData, TimelineData{Date: endTime.Unix(), Value: 0})
	powerOffData = append(powerOffData, TimelineData{Date: endTime.Unix(), Value: 0})
	var responseData CalendarOutput
	responseData.Result = "ok"
	responseData.ProductionData = productionData
	responseData.DowntimeData = downtimeData
	responseData.PowerOffData = powerOffData
	writer.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(writer).Encode(responseData)
	logInfo("MAIN", "Parsing data ended")
}