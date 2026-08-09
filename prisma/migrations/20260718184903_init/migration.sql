-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'RESTAURANT_MEMBER', 'SUPPLIER_MEMBER');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('en', 'ar');

-- CreateEnum
CREATE TYPE "AmenityKind" AS ENUM ('SERVICE', 'AMENITY');

-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('RESTAURANT', 'FAST_FOOD', 'COFFEE_SHOP', 'BAR', 'DISCO', 'NIGHTCLUB', 'TOURIST_PARK');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingSource" AS ENUM ('LEGACY_IMPORT', 'MEMBER_SUBMITTED', 'ADMIN_CREATED');

-- CreateEnum
CREATE TYPE "PriceTier" AS ENUM ('UNKNOWN', 'BUDGET', 'MODERATE', 'UPSCALE', 'FINE_DINING');

-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('ACTIVE_RESTAURANT', 'ASSOCIATE_SUPPLIER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO');

-- CreateEnum
CREATE TYPE "ChangeRequestEntityType" AS ENUM ('RESTAURANT', 'SUPPLIER', 'MARKETPLACE_LISTING');

-- CreateEnum
CREATE TYPE "ChangeRequestAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('NEWS', 'PRESS_RELEASE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'HANDLED');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "MarketplaceCategory" AS ENUM ('RESTAURANT_FOR_SALE', 'EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'INVESTMENT_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "MarketplaceStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'SCORED');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('MET', 'PARTIAL', 'NOT_MET', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "SustainabilityStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('LAW', 'REGULATION', 'INSTRUCTION');

-- CreateEnum
CREATE TYPE "MagazineAccessLevel" AS ENUM ('PUBLIC', 'MEMBERS_ONLY');

-- CreateEnum
CREATE TYPE "CourseTrack" AS ENUM ('CHEFS', 'SERVICE', 'BARISTA', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('STUDY', 'GUIDE', 'TEMPLATE', 'PROJECT', 'OPPORTUNITY', 'CASE_STUDY', 'ANNUAL_REPORT', 'HR_MANUAL');

-- CreateEnum
CREATE TYPE "PersonKind" AS ENUM ('BOARD_MEMBER', 'STAFF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "localePref" "Locale" NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governorates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "governorateId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisines" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "kind" "AmenityKind" NOT NULL DEFAULT 'AMENITY',

    CONSTRAINT "amenity_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_levels" (
    "id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,

    CONSTRAINT "classification_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "shortDescription" TEXT,
    "fullDescriptionHtml" TEXT,
    "governorateId" TEXT,
    "areaId" TEXT,
    "addressText" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "classificationLevelId" TEXT,
    "establishmentType" "EstablishmentType" NOT NULL DEFAULT 'RESTAURANT',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "whatsapp" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "openingHoursText" TEXT,
    "priceTier" "PriceTier" NOT NULL DEFAULT 'UNKNOWN',
    "greenKeyCertified" BOOLEAN NOT NULL DEFAULT false,
    "sustainabilityScore" DOUBLE PRECISION,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "ListingSource" NOT NULL DEFAULT 'ADMIN_CREATED',
    "legacyProductId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_images" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altTextEn" TEXT,
    "altTextAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "legacyPath" TEXT,

    CONSTRAINT "restaurant_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_cuisines" (
    "restaurantId" TEXT NOT NULL,
    "cuisineId" TEXT NOT NULL,

    CONSTRAINT "restaurant_cuisines_pkey" PRIMARY KEY ("restaurantId","cuisineId")
);

-- CreateTable
CREATE TABLE "restaurant_amenity_tags" (
    "restaurantId" TEXT NOT NULL,
    "amenityTagId" TEXT NOT NULL,

    CONSTRAINT "restaurant_amenity_tags_pkey" PRIMARY KEY ("restaurantId","amenityTagId")
);

-- CreateTable
CREATE TABLE "supplier_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "parentId" TEXT,

    CONSTRAINT "supplier_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "shortDescription" TEXT,
    "fullDescriptionHtml" TEXT,
    "governorateId" TEXT,
    "addressText" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "ListingSource" NOT NULL DEFAULT 'ADMIN_CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_images" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altTextEn" TEXT,
    "altTextAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "supplier_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_category_map" (
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "supplier_category_map_pkey" PRIMARY KEY ("supplierId","categoryId")
);

-- CreateTable
CREATE TABLE "membership_applications" (
    "id" TEXT NOT NULL,
    "applicantType" "ApplicantType" NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "governorateId" TEXT,
    "classificationClaim" TEXT,
    "documents" JSONB,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "entityType" "ChangeRequestEntityType" NOT NULL,
    "entityId" TEXT,
    "action" "ChangeRequestAction" NOT NULL,
    "payload" JSONB NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL DEFAULT 'NEWS',
    "publishedAt" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_translations" (
    "newsArticleId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "excerpt" TEXT,

    CONSTRAINT "news_translations_pkey" PRIMARY KEY ("newsArticleId","locale")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "locationText" TEXT,
    "registrationUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_translations" (
    "eventId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,

    CONSTRAINT "event_translations_pkey" PRIMARY KEY ("eventId","locale")
);

-- CreateTable
CREATE TABLE "media_gallery_items" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "newsArticleId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "media_gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "interests" TEXT[],
    "localePref" "Locale" NOT NULL DEFAULT 'en',
    "status" "SubscriberStatus" NOT NULL DEFAULT 'SUBSCRIBED',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "category" "MarketplaceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "priceCurrency" TEXT NOT NULL DEFAULT 'JOD',
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "postedById" TEXT NOT NULL,
    "status" "MarketplaceStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listing_images" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "marketplace_listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_standards" (
    "id" TEXT NOT NULL,
    "establishmentType" "EstablishmentType" NOT NULL,
    "sourcePdfUrl" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT,
    "totalPossiblePoints" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "classification_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_sections" (
    "id" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classification_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_criteria" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textAr" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classification_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classification_star_bands" (
    "id" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "stars" INTEGER NOT NULL,

    CONSTRAINT "classification_star_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "establishmentType" "EstablishmentType" NOT NULL,
    "criteriaVersionLabel" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalScore" DOUBLE PRECISION,
    "resultingStars" INTEGER,
    "startedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "status" "AnswerStatus" NOT NULL,
    "achievedPoints" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "evidenceFileUrl" TEXT,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_assessments" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "SustainabilityStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "sustainability_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_inputs" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "sustainability_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sustainability_benchmarks" (
    "metricKey" TEXT NOT NULL,
    "sectorAvg" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "sustainability_benchmarks_pkey" PRIMARY KEY ("metricKey")
);

-- CreateTable
CREATE TABLE "sustainability_scores" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sustainability_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "topic" TEXT,
    "entity" TEXT,
    "year" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "supersedesId" TEXT,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_versions" (
    "id" TEXT NOT NULL,
    "legalDocumentId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "bodyHtml" TEXT,

    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_alert_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "topics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_alert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_issues" (
    "id" TEXT NOT NULL,
    "issueNumber" INTEGER,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "coverImageUrl" TEXT,
    "pdfUrl" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "magazine_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_articles" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "accessLevel" "MagazineAccessLevel" NOT NULL DEFAULT 'PUBLIC',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "magazine_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magazine_article_translations" (
    "articleId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,

    CONSTRAINT "magazine_article_translations_pkey" PRIMARY KEY ("articleId","locale")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "track" "CourseTrack" NOT NULL,
    "coverImageUrl" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_translations" (
    "courseId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,

    CONSTRAINT "course_translations_pkey" PRIMARY KEY ("courseId","locale")
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "locationText" TEXT,
    "capacity" INTEGER,

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_registrations" (
    "id" TEXT NOT NULL,
    "courseSessionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "restaurantId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "slug" TEXT NOT NULL,
    "fileUrl" TEXT,
    "deadlineAt" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_translations" (
    "resourceId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "summary" TEXT,

    CONSTRAINT "resource_translations_pkey" PRIMARY KEY ("resourceId","locale")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "kind" "PersonKind" NOT NULL,
    "name" TEXT NOT NULL,
    "positionEn" TEXT,
    "positionAr" TEXT,
    "photoUrl" TEXT,
    "email" TEXT,
    "bioHtml" TEXT,
    "termLabel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "BusinessManager_userId_idx" ON "BusinessManager"("userId");

-- CreateIndex
CREATE INDEX "BusinessManager_restaurantId_idx" ON "BusinessManager"("restaurantId");

-- CreateIndex
CREATE INDEX "BusinessManager_supplierId_idx" ON "BusinessManager"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "governorates_slug_key" ON "governorates"("slug");

-- CreateIndex
CREATE INDEX "areas_governorateId_idx" ON "areas"("governorateId");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_slug_key" ON "cuisines"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "amenity_tags_slug_key" ON "amenity_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "classification_levels_stars_key" ON "classification_levels"("stars");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE INDEX "restaurants_status_idx" ON "restaurants"("status");

-- CreateIndex
CREATE INDEX "restaurants_governorateId_idx" ON "restaurants"("governorateId");

-- CreateIndex
CREATE INDEX "restaurants_classificationLevelId_idx" ON "restaurants"("classificationLevelId");

-- CreateIndex
CREATE INDEX "restaurant_images_restaurantId_idx" ON "restaurant_images"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_categories_slug_key" ON "supplier_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_slug_key" ON "suppliers"("slug");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "supplier_images_supplierId_idx" ON "supplier_images"("supplierId");

-- CreateIndex
CREATE INDEX "membership_applications_status_idx" ON "membership_applications"("status");

-- CreateIndex
CREATE INDEX "change_requests_status_idx" ON "change_requests"("status");

-- CreateIndex
CREATE INDEX "change_requests_entityType_entityId_idx" ON "change_requests"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- CreateIndex
CREATE INDEX "news_articles_status_publishedAt_idx" ON "news_articles"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "marketplace_listings_status_category_idx" ON "marketplace_listings"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "classification_standards_establishmentType_key" ON "classification_standards"("establishmentType");

-- CreateIndex
CREATE INDEX "classification_sections_standardId_idx" ON "classification_sections"("standardId");

-- CreateIndex
CREATE INDEX "classification_criteria_sectionId_idx" ON "classification_criteria"("sectionId");

-- CreateIndex
CREATE INDEX "classification_star_bands_standardId_idx" ON "classification_star_bands"("standardId");

-- CreateIndex
CREATE INDEX "assessment_sessions_restaurantId_idx" ON "assessment_sessions"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_answers_sessionId_criterionId_key" ON "assessment_answers"("sessionId", "criterionId");

-- CreateIndex
CREATE INDEX "sustainability_assessments_restaurantId_idx" ON "sustainability_assessments"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_slug_key" ON "legal_documents"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_supersedesId_key" ON "legal_documents"("supersedesId");

-- CreateIndex
CREATE UNIQUE INDEX "magazine_articles_slug_key" ON "magazine_articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_type_status_idx" ON "resources"("type", "status");

-- CreateIndex
CREATE INDEX "people_kind_idx" ON "people"("kind");

-- AddForeignKey
ALTER TABLE "BusinessManager" ADD CONSTRAINT "BusinessManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessManager" ADD CONSTRAINT "BusinessManager_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessManager" ADD CONSTRAINT "BusinessManager_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "governorates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_classificationLevelId_fkey" FOREIGN KEY ("classificationLevelId") REFERENCES "classification_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_images" ADD CONSTRAINT "restaurant_images_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_cuisines" ADD CONSTRAINT "restaurant_cuisines_cuisineId_fkey" FOREIGN KEY ("cuisineId") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_amenity_tags" ADD CONSTRAINT "restaurant_amenity_tags_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_amenity_tags" ADD CONSTRAINT "restaurant_amenity_tags_amenityTagId_fkey" FOREIGN KEY ("amenityTagId") REFERENCES "amenity_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_categories" ADD CONSTRAINT "supplier_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "supplier_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_images" ADD CONSTRAINT "supplier_images_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_map" ADD CONSTRAINT "supplier_category_map_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_category_map" ADD CONSTRAINT "supplier_category_map_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "supplier_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_translations" ADD CONSTRAINT "news_translations_newsArticleId_fkey" FOREIGN KEY ("newsArticleId") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_translations" ADD CONSTRAINT "event_translations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_gallery_items" ADD CONSTRAINT "media_gallery_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_gallery_items" ADD CONSTRAINT "media_gallery_items_newsArticleId_fkey" FOREIGN KEY ("newsArticleId") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listing_images" ADD CONSTRAINT "marketplace_listing_images_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_sections" ADD CONSTRAINT "classification_sections_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "classification_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_criteria" ADD CONSTRAINT "classification_criteria_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "classification_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classification_star_bands" ADD CONSTRAINT "classification_star_bands_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "classification_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "classification_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_assessments" ADD CONSTRAINT "sustainability_assessments_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_inputs" ADD CONSTRAINT "sustainability_inputs_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "sustainability_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sustainability_scores" ADD CONSTRAINT "sustainability_scores_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "sustainability_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "legal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_legalDocumentId_fkey" FOREIGN KEY ("legalDocumentId") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_articles" ADD CONSTRAINT "magazine_articles_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "magazine_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magazine_article_translations" ADD CONSTRAINT "magazine_article_translations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "magazine_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_translations" ADD CONSTRAINT "course_translations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_registrations" ADD CONSTRAINT "course_registrations_courseSessionId_fkey" FOREIGN KEY ("courseSessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_translations" ADD CONSTRAINT "resource_translations_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
