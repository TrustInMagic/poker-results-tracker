-- CreateTable
CREATE TABLE "PokerSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "stake" TEXT NOT NULL,
    "startingBalance" DOUBLE PRECISION NOT NULL,
    "endingBalance" DOUBLE PRECISION NOT NULL,
    "hoursPlayed" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PokerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RakebackEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RakebackEntry_pkey" PRIMARY KEY ("id")
);
