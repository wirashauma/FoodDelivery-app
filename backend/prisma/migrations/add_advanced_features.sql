-- Enable PostGIS extension for geo-spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geo-location columns to orders table for route optimization
ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "merchantLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "merchantLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "actualDistance" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "estimatedDuration" INTEGER,
  ADD COLUMN IF NOT EXISTS "actualDuration" INTEGER,
  ADD COLUMN IF NOT EXISTS "routePolyline" TEXT;

-- Add geo columns to merchants table
ALTER TABLE "Merchant"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "geolocation" geography(POINT, 4326);

-- Add geo columns to driver profile for real-time tracking
ALTER TABLE "DriverProfile"
  ADD COLUMN IF NOT EXISTS "currentLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currentLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currentLocation" geography(POINT, 4326),
  ADD COLUMN IF NOT EXISTS "lastLocationUpdate" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "isLocationSharing" BOOLEAN DEFAULT false;

-- Create spatial index for faster geo queries
CREATE INDEX IF NOT EXISTS "idx_merchant_geolocation" ON "Merchant" USING GIST (geolocation);
CREATE INDEX IF NOT EXISTS "idx_driver_current_location" ON "DriverProfile" USING GIST (current_location);

-- Add transaction type enum for wallet
DO $$ BEGIN
    CREATE TYPE "TransactionType" AS ENUM (
        'CREDIT',
        'DEBIT',
        'WITHDRAW',
        'TOPUP',
        'REFUND',
        'EARNING',
        'COMMISSION',
        'FEE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update wallet_transactions to use enum
ALTER TABLE "wallet_transactions"
  ALTER COLUMN "type" TYPE "TransactionType" USING "type"::text::"TransactionType";

-- Add ledger columns for double-entry bookkeeping
ALTER TABLE "wallet_transactions"
  ADD COLUMN IF NOT EXISTS "debit" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "credit" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "category" VARCHAR(50);

-- Create payment transactions table for payment gateway integration
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
  "id" SERIAL PRIMARY KEY,
  "paymentId" INTEGER UNIQUE NOT NULL,
  "externalTransactionId" VARCHAR(255),
  "provider" VARCHAR(50) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "amount" INTEGER NOT NULL,
  "status" "PaymentStatus" DEFAULT 'PENDING',
  "responseData" JSONB,
  "webhookData" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "paidAt" TIMESTAMP,
  "expiredAt" TIMESTAMP,
  
  CONSTRAINT "fk_payment" FOREIGN KEY ("paymentId") 
    REFERENCES "Payment"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_payment_transaction_external_id" ON "PaymentTransaction"("externalTransactionId");
CREATE INDEX IF NOT EXISTS "idx_payment_transaction_status" ON "PaymentTransaction"("status");

-- Create notification device tokens table for FCM
CREATE TABLE IF NOT EXISTS "DeviceToken" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(500) NOT NULL,
  "platform" VARCHAR(20) NOT NULL,
  "deviceId" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT "fk_device_user" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_device_token" UNIQUE ("userId", "token")
);

CREATE INDEX IF NOT EXISTS "idx_device_token_user" ON "DeviceToken"("userId");
CREATE INDEX IF NOT EXISTS "idx_device_token_active" ON "DeviceToken"("isActive");

-- Create full-text search indexes for products and merchants
CREATE INDEX IF NOT EXISTS "idx_product_name_search" ON "Product" USING GIN(to_tsvector('indonesian', "name"));
CREATE INDEX IF NOT EXISTS "idx_product_description_search" ON "Product" USING GIN(to_tsvector('indonesian', "description"));
CREATE INDEX IF NOT EXISTS "idx_merchant_name_search" ON "Merchant" USING GIN(to_tsvector('indonesian', "name"));
CREATE INDEX IF NOT EXISTS "idx_merchant_description_search" ON "Merchant" USING GIN(to_tsvector('indonesian', "description"));

-- Function to update merchant geolocation from lat/long
CREATE OR REPLACE FUNCTION update_merchant_geolocation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geolocation = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update merchant geolocation
DROP TRIGGER IF EXISTS trg_update_merchant_geolocation ON "Merchant";
CREATE TRIGGER trg_update_merchant_geolocation
  BEFORE INSERT OR UPDATE OF latitude, longitude ON "Merchant"
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_geolocation();

-- Function to update driver current location
CREATE OR REPLACE FUNCTION update_driver_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."currentLatitude" IS NOT NULL AND NEW."currentLongitude" IS NOT NULL THEN
    NEW."currentLocation" = ST_SetSRID(ST_MakePoint(NEW."currentLongitude", NEW."currentLatitude"), 4326)::geography;
    NEW."lastLocationUpdate" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update driver location
DROP TRIGGER IF EXISTS trg_update_driver_location ON "DriverProfile";
CREATE TRIGGER trg_update_driver_location
  BEFORE INSERT OR UPDATE OF "currentLatitude", "currentLongitude" ON "DriverProfile"
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_location();

-- Add comments for documentation
COMMENT ON COLUMN "Order"."actualDistance" IS 'Actual road distance in kilometers (from routing API)';
COMMENT ON COLUMN "Order"."estimatedDuration" IS 'Estimated travel time in minutes';
COMMENT ON COLUMN "Order"."actualDuration" IS 'Actual delivery time in minutes';
COMMENT ON COLUMN "Order"."routePolyline" IS 'Encoded polyline for route visualization';
COMMENT ON COLUMN "Merchant"."geolocation" IS 'PostGIS geography point for spatial queries';
COMMENT ON COLUMN "DriverProfile"."currentLocation" IS 'Real-time driver location for geo-fencing';
