#!/usr/bin/env bash
docker build -t engageai-front-12:latest ../engageai-front-12
sudo systemctl stop engageai-front-12
sudo cp engageai-front-12.service /usr/lib/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start engageai-front-12
sudo systemctl status engageai-front-12