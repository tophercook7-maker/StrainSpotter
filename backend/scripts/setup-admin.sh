#!/bin/bash

# Setup admin account for StrainSpotter
# This script creates an admin account with:
# - Password: KING123
# - Membership: club (auto-set)
# - Role: admin

echo "🌿 StrainSpotter Admin Account Setup"
echo "===================================="
echo ""

# Check if email is provided as argument
if [ -z "$1" ]; then
  echo "Please enter your admin email address:"
  read ADMIN_EMAIL
else
  ADMIN_EMAIL=$1
fi

if [ -z "$ADMIN_EMAIL" ]; then
  echo "❌ Email address is required"
  exit 1
fi

echo ""
echo "Creating admin account for: $ADMIN_EMAIL"
echo "Password will be: KING123"
echo ""

cd backend
node scripts/create-admin.js "$ADMIN_EMAIL"

