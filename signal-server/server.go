package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	log "github.com/sirupsen/logrus"
	"net/http"
	"nhooyr.io/websocket"
)

type Connection struct {
	Send    chan<- Message
	Receive <-chan Message
	IsOpen  bool
	Id      string
}

type MessageType string

const (
	Join   = MessageType("join")
	Leave  = MessageType("leave")
	Answer = MessageType("answer")
	Offer  = MessageType("offer")
	Ice    = MessageType("ice")
)

type Message struct {
	Type    MessageType `json:"type"`
	Content string      `json:"content"`
	To      string      `json:"to"`
	From    string      `json:"from"`
}

func receiver(
	connection *websocket.Conn,
	requestContext context.Context,
	messages chan<- Message,
) {
	for {
		_, content, err := connection.Read(requestContext)
		if err != nil {
			break
		}

		var message Message
		if err := json.Unmarshal(content, &message); err != nil {
			log.WithError(err).
				Error("Invalid message")
			continue
		}

		messages <- message
	}

	close(messages)
}

func sender(
	connection *websocket.Conn,
	requestContext context.Context,
	messages <-chan Message,
) {
	for message := range messages {
		data, err := json.Marshal(message)
		if err != nil {
			continue
		}

		if err := connection.Write(requestContext, websocket.MessageText, data); err != nil {
			log.WithError(err).
				Error("Unable to send message")
		}
	}
}

func generateId() string {
	bytes := make([]byte, 5)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}

	return hex.EncodeToString(bytes)
}

func openConnection(
	response http.ResponseWriter,
	request *http.Request,
	connections chan<- *Connection,
) {
	connection, err := websocket.Accept(response, request, &websocket.AcceptOptions{
		OriginPatterns: []string{"*:5173"},
	})

	if err != nil {
		log.WithError(err).
			Error("Unable to open socket connection")
		return
	}

	id := generateId()
	requestContext := request.Context()
	receive := make(chan Message)
	send := make(chan Message)

	go sender(connection, requestContext, send)
	connections <- &Connection{
		Send:    send,
		Receive: receive,
		IsOpen:  true,
		Id:      id,
	}

	log.WithField("id", id).
		Info("Opened new connection")
	receiver(connection, requestContext, receive)
}

func WebsocketServer(connections chan<- *Connection) {
	handler := http.HandlerFunc(
		func(response http.ResponseWriter, request *http.Request) {
			openConnection(response, request, connections)
		})

	log.Info("Starting WebSocket server on port 8080")
	if err := http.ListenAndServe("0.0.0.0:8080", handler); err != nil {
		panic(err)
	}
}
