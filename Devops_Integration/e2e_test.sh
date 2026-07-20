#!/bin/bash
# End-to-end integration test script for MarketMind Milestone 1

echo "Waiting for services to be ready..."
sleep 15 # Wait for containers to start up fully

echo "Testing Backend Health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
if [ "$BACKEND_STATUS" -eq 200 ]; then
  echo "✅ Backend is UP"
else
  echo "❌ Backend is DOWN (HTTP $BACKEND_STATUS)"
  exit 1
fi

echo "Testing Security Gateway Health..."
SECURITY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6000/)
if [ "$SECURITY_STATUS" -eq 200 ]; then
  echo "✅ Security Gateway is UP"
else
  echo "❌ Security Gateway is DOWN (HTTP $SECURITY_STATUS)"
  exit 1
fi

echo "Testing AI Service Health..."
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/)
if [ "$AI_STATUS" -eq 200 ]; then
  echo "✅ AI Service is UP"
else
  echo "❌ AI Service is DOWN (HTTP $AI_STATUS)"
  exit 1
fi

echo "Testing Frontend Application..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
  echo "✅ Frontend is UP"
else
  echo "❌ Frontend is DOWN (HTTP $FRONTEND_STATUS)"
  exit 1
fi

echo "🎉 All services are healthy!"
exit 0
