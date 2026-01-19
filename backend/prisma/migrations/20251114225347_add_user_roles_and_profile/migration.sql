/*
  Warnings:

  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'DELIVERER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "foto_profil" TEXT,
ADD COLUMN     "nama" VARCHAR(100),
ADD COLUMN     "no_hp" VARCHAR(20),
ADD COLUMN     "role" "Role" NOT NULL,
ADD COLUMN     "tgl_lahir" DATE;
