package main

import (
	"fmt"
)

func logInfo(reference, data string) {
	fmt.Println("["+reference+"] --INF-- "+data)
}

func logError(reference, data string) {
	fmt.Println("["+reference+"] --ERR-- "+data)
}

