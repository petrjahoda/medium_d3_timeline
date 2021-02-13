package main

import (
	"encoding/json"
	"github.com/julienschmidt/httprouter"
	"math/rand"
	"net/http"
	"time"
)

type TimelineInput struct {
	Date int64
}

type TimelineOutput struct {
	Result         string
	ProductionData []TimelineData
	DowntimeData   []TimelineData
}

type TimelineData struct {
	Date  int64
	Value int
}

func getTimeLineData(writer http.ResponseWriter, request *http.Request, params httprouter.Params) {
	logInfo("MAIN", "Timeline function called")
	var data TimelineInput
	err := json.NewDecoder(request.Body).Decode(&data)
	if err != nil {
		logError("MAIN", "Error parsing data: "+err.Error())
		var responseData TimelineOutput
		responseData.Result = "nok: " + err.Error()
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(responseData)
		logInfo("MAIN", "Parsing data ended")
		return
	}
	endTime := time.Unix(data.Date/1000, 0)
	var productionData []TimelineData
	var downtimeData []TimelineData
	initialTime := endTime.Add(-24 * time.Hour)
	productionValue := 1
	downtimeValue := 0
	for initialTime.Before(endTime) {
		productionData = append(productionData, TimelineData{Date: initialTime.Unix(), Value: productionValue})
		downtimeData = append(downtimeData, TimelineData{Date: initialTime.Unix(), Value: downtimeValue})
		randomDuration := rand.Intn(61-1) + 1
		initialTime = initialTime.Add(time.Duration(randomDuration) * time.Minute)
		tempValue := productionValue
		productionValue = downtimeValue
		downtimeValue = tempValue
	}

	var responseData TimelineOutput
	responseData.Result = "ok"
	responseData.ProductionData = productionData
	responseData.DowntimeData = downtimeData

	writer.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(writer).Encode(responseData)
	logInfo("MAIN", "Parsing data ended successfully")
}
