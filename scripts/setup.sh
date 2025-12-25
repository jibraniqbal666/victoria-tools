#!/bin/bash

echo "Setting up Victoria Tools..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd server && npm install && cd ..

echo "Setup complete!"
echo ""
echo "To start development:"
echo "  Frontend: npm run dev"
echo "  Backend:  cd server && npm start"
echo ""
echo "To build for production:"
echo "  npm run build"

