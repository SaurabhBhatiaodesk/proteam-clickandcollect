-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN,
    "locale" TEXT,
    "collaborator" BOOLEAN,
    "emailVerified" BOOLEAN,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleApi" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "apikey" TEXT NOT NULL,
    "ipkey" TEXT NOT NULL,

    CONSTRAINT "GoogleApi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleData" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "apikey" TEXT,
    "customerlocation" TEXT,
    "destinationsArr" TEXT,
    "resultsArr" JSONB NOT NULL,

    CONSTRAINT "GoogleData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "connection_id" TEXT,
    "uid" TEXT,
    "user_id" TEXT,
    "plan_id" TEXT,
    "custom_name" TEXT,
    "custom_note" TEXT,
    "sync_type" TEXT,
    "configured" BOOLEAN DEFAULT false,
    "is_sync_enabled" BOOLEAN DEFAULT false,
    "is_plugins_connected" BOOLEAN DEFAULT false,
    "config" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "status" TEXT,
    "active_subscription_id" TEXT,
    "token" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_shop_key" ON "UserConnection"("shop");
