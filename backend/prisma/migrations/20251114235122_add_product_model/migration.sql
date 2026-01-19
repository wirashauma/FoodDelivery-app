-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
