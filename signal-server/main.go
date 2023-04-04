package main

import log "github.com/sirupsen/logrus"

func handleConnection(connection *Connection, broadcast chan<- Message) {
	for message := range connection.Receive {
		log.WithFields(log.Fields{
			"type": message.Type,
			"from": message.From,
			"to":   message.To,
		}).Info("Got message")

		log.WithField("content", message.Content).
			Trace("Content")

		broadcast <- message
	}

	connection.IsOpen = false
	log.WithField("id", connection.Id).
		Info("Connection closed")

	broadcast <- Message{
		Type: Leave,
		To:   "",
		From: connection.Id,
	}
}

func removeClosedConnections(connections []*Connection) []*Connection {
	var openConnections []*Connection
	for _, connection := range connections {
		if connection.IsOpen {
			openConnections = append(openConnections, connection)
		}
	}

	return openConnections
}

func connectionManager(connections <-chan *Connection) {
	var openConnections []*Connection
	broadcast := make(chan Message)

	for {
		select {
		case message := <-broadcast:
			openConnections = removeClosedConnections(openConnections)
			for _, connection := range openConnections {
				if message.To == "" || message.To == connection.Id {
					connection.Send <- message
				}
			}

		case newConnection := <-connections:
			go handleConnection(newConnection, broadcast)

			openConnections = removeClosedConnections(openConnections)
			openConnections = append(openConnections, newConnection)
			for _, connection := range openConnections {
				if connection.Id == newConnection.Id {
					continue
				}

				connection.Send <- Message{
					Type: Join,
					From: newConnection.Id,
					To:   connection.Id,
				}
			}
		}
	}
}

func main() {
	connections := make(chan *Connection)
	go connectionManager(connections)
	WebsocketServer(connections)
}
