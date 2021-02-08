package main

import (
	"github.com/julienschmidt/httprouter"
	"net/http"
)

func homepage(writer http.ResponseWriter, request *http.Request, params httprouter.Params) {
	logInfo("MAIN", "Serving homepage")
	http.ServeFile(writer, request, "./html/homepage.html")
}