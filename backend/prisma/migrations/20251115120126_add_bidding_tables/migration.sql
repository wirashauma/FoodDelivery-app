/*
  Warnings:

  - You are about to drop the column `customer_name` on the `orders` table. All the data in the column will be lost.
  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('WAITING_FOR_OFFERS', 'OFFER_ACCEPTED', 'ON_DELIVERY', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customer_name",
ADD COLUMN     "deliverer_id" INTEGER,
ADD COLUMN     "final_fee" INTEGER,
ALTER COLUMN "item_id" SET DATA TYPE VARCHAR(255),
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'WAITING_FOR_OFFERS';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "fee" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" INTEGER NOT NULL,
    "deliverer_id" INTEGER NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offer_order_id_deliverer_id_key" ON "Offer"("order_id", "deliverer_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliverer_id_fkey" FOREIGN KEY ("deliverer_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_deliverer_id_fkey" FOREIGN KEY ("deliverer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
