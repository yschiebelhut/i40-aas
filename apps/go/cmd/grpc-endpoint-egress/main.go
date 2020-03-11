package main

import (
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/logging"
)

var err error

func main() {
	output := os.Getenv("LOG_OUTPUT")
	if output == "" {
		output = "CONSOLE"
	}
	level := os.Getenv("LOG_LEVEL")
	if level == "" {
		level = "DEBUG"
	}
	log.Logger, err = logging.SetupLogging(output, level)
	if err != nil {
		log.Error().Err(err).Msg("failed to configure global logger")
	}

	if os.Getenv("HOME") != "/home/aasuser" {
		err := godotenv.Load(".env")
		if err == nil {
			log.Warn().Msg("***** DEVELOPMENT MODE: Successfully loaded .env file from ./ *****")
		}
	}

	var (
		AMQPCfg       amqpclient.Config
		GRPCEgressCfg GRPCEgressConfig
		GRPCEgress    GRPCEgress
	)

	amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_PORT"))
	AMQPCfg = amqpclient.Config{
		Host:     os.Getenv("RABBITMQ_HOST"),
		Port:     amqpPort,
		User:     os.Getenv("RABBITMQ_EGRESS_USER"),
		Password: os.Getenv("RABBITMQ_EGRESS_PASSWORD"),
		Exchange: os.Getenv("RABBITMQ_EGRESS_EXCHANGE"),
	}

	GRPCEgressCfg = GRPCEgressConfig{
		AMQPConfig: AMQPCfg,
	}

	GRPCEgress = NewGRPCEgress(GRPCEgressCfg)

	GRPCEgress.Init()

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	GRPCEgress.Shutdown()
	os.Exit(0)
}