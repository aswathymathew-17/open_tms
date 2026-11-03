-- Why a buyer rejected a carrier's bid, so the carrier can see it in the portal.

-- AlterTable
ALTER TABLE "TenderBid" ADD COLUMN     "rejectionReason" TEXT;
