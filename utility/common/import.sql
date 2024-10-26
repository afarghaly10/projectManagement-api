DROP TABLE IF EXISTS ClientSampleTemplates;
DROP TABLE IF EXISTS Audience;
DROP TABLE IF EXISTS StudyGeography;
DROP TABLE IF EXISTS AppUsage;
DROP TABLE IF EXISTS StudyLanguage;
DROP TABLE IF EXISTS StudyTranslation;
DROP TABLE IF EXISTS StudyProduct;
DROP TABLE IF EXISTS ProductAsset;
DROP TABLE IF EXISTS QuestionOption;
DROP TABLE IF EXISTS Answer;
DROP TABLE IF EXISTS ProductPrediction;
DROP TABLE IF EXISTS Translation;
DROP TABLE IF EXISTS ProductTranslation;
DROP TABLE IF EXISTS Interest;
DROP TABLE IF EXISTS Tradeoff;
DROP TABLE IF EXISTS StudyCategory;
DROP TABLE IF EXISTS StudySample;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS StudyAsset;
DROP TABLE IF EXISTS ProductTag;
DROP TABLE IF EXISTS Response;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Respondent;
DROP TABLE IF EXISTS StudySetting;
DROP TABLE IF EXISTS QuestionTranslation;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS EndpointLog;
DROP TABLE IF EXISTS GeographyLanguage;
DROP TABLE IF EXISTS Geography;
DROP TABLE IF EXISTS TranslationLanguage;
DROP TABLE IF EXISTS Client;
DROP TABLE IF EXISTS AssetVariation;
DROP TABLE IF EXISTS AssetMeta;
DROP TABLE IF EXISTS TermRelations;
DROP TABLE IF EXISTS Term;
DROP TABLE IF EXISTS Taxonomy;
DROP TABLE IF EXISTS Groups;
DROP TABLE IF EXISTS GroupUsers;
DROP TABLE IF EXISTS ModelAccess;
DROP TABLE IF EXISTS AccessKey;
DROP TABLE IF EXISTS AccountClients;
DROP TABLE IF EXISTS AccountSettings;
DROP TABLE IF EXISTS Accounts;
DROP TABLE IF EXISTS AccountSetupQueue;
DROP TABLE IF EXISTS SampleTemplates;
DROP TABLE IF EXISTS Provider;
DROP TABLE IF EXISTS Study;
DROP TABLE IF EXISTS Asset;

CREATE TABLE TranslationLanguage (
    label varchar(32),
    languageCode varchar(5), -- ISO 693-3
    lucidCode varchar(8),
    lucidCountryLanguageId int,
    isActive boolean default 1,
    PRIMARY KEY (languageCode)
);

INSERT INTO TranslationLanguage (label, languageCode, lucidCountryLanguageId, lucidCode) VALUES ('English (Canada)', 'en_CA', 6, 'eng_CA');
INSERT INTO TranslationLanguage (label, languageCode) VALUES ('Spanish', 'es_ES');
INSERT INTO TranslationLanguage (label, languageCode) VALUES ('French', 'fr_FR');

CREATE TABLE EndpointLog (
    id int NOT NULL AUTO_INCREMENT,
    entryTime timestamp DEFAULT CURRENT_TIMESTAMP,
    requestBody varchar(2000),
    endpoint varchar(255),
    method varchar(16),
    ipAddress varchar(32),
    userId varchar(255),
    PRIMARY KEY (id)
);

CREATE TABLE Asset(
    id int NOT NULL AUTO_INCREMENT,
    title text NULL,
    description text NULL,
    deletedAt timestamp NULL,
    clientId varchar(255),
    PRIMARY KEY (id)
);

INSERT INTO Asset (title, description) VALUES ('TEST', '');

CREATE TABLE AssetVariation(
    id int NOT NULL AUTO_INCREMENT,
    assetId int NOT NULL,
    type varchar(64),
    provider varchar(36),
    fileKey varchar(128),
    location varchar(255),
    bucket varchar(128),
    mimetype varchar(128),
    fileSize varchar(64),
    PRIMARY KEY (id),
    FOREIGN KEY (assetId) REFERENCES Asset(id)
);

INSERT INTO `AssetVariation` (`id`, `provider`, `fileKey`, `location`, `bucket`, `mimetype`, `fileSize`, `assetId`)
VALUES
	(1, 'S3', 'test.png', 'https://testbucket.s3.amazon.com/test.png', 'testbucket', 'image/png', '10073', 1);

CREATE TABLE Study (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    defaultLanguage varchar(255),
    description text,
    status varchar(255) NOT NULL,
    clientId varchar(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deletedAt timestamp NULL,
    lastModifiedAt timestamp NULL,
    lastModifiedBy varchar(255) NULL,
    asset int,
    base int,
    PRIMARY KEY (id),
    FOREIGN KEY (asset) REFERENCES Asset(id)
);

INSERT INTO `Study` (`id`, `name`, `status`, `clientId`, `createdAt`)
VALUES(1, 'test', 'public', 'client:ffffffff-ffff-4fff-bfff-ffffffffffff', DATE("2018-12-12"));

CREATE TABLE StudySetting (
    id int NOT NULL AUTO_INCREMENT,
    studyId int,
    layout varchar(64),
    tradeoffLayout varchar(64),
    mobileOnly boolean,
    tradeoffs boolean,
    sendWinningProduct boolean,
    sendLikedProducts boolean,
    enableDetailView boolean,
    redirectUrl varchar(512),
    productIndex int,
    enableBarChart boolean,
    enableNetworkMap boolean,
    enableQuadrantChart boolean,
    enableOptimizer boolean,
    enableVirtualMarkets boolean,
    optimizerUrl varchar(512),
    ageBins TEXT,
    vendor varchar(256),
    virtualMarketsUrl varchar(512),
    productCategories varchar(512),
    defaultProviderCode varchar(20),
    useSampleProvider BOOLEAN DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id)
);

CREATE TABLE StudyTranslation (
    id int NOT NULL AUTO_INCREMENT,
    studyId int,
    languageCode varchar(5),
    introText varchar(512),
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id)
);

CREATE TABLE Product (
    id int NOT NULL AUTO_INCREMENT,
    clientId varchar(255),
    name varchar(255),
    layout varchar(50),
    defaultLanguageCode varchar(5),
    status varchar(20),
    title varchar(255) NULL,
    subtitle varchar(255) NULL,
    price varchar(50) NULL,
    description text NULL,
    fieldOne tinytext NULL,
    fieldOneType enum('html', 'asset') NULL,
    fieldOneOptions varchar(512),
    fieldTwo tinytext NULL,
    fieldTwoType enum('html', 'asset') NULL,
    fieldTwoOptions varchar(512),
    deletedAt timestamp NULL,
    hasErrors boolean,
    hasWarnings boolean,
    lastModifiedAt timestamp NULL,
    PRIMARY KEY (id)
);

CREATE TABLE ProductTranslation(
    id int NOT NULL AUTO_INCREMENT,
    productId int,
    languageCode varchar(5),
    title varchar(255) NULL,
    subtitle varchar(255) NULL,
    price varchar(50) NULL,
    description text NULL,
    fieldOne tinytext NULL,
    fieldOneType enum('html', 'asset') NULL,
    fieldOneOptions varchar(512),
    fieldTwo tinytext NULL,
    fieldTwoType enum('html', 'asset') NULL,
    fieldTwoOptions varchar(512),
    options varchar(512),
    hasErrors boolean,
    hasWarnings boolean,
    validations text,
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE StudyProduct (
    id int NOT NULL AUTO_INCREMENT,
    studyId int,
    productId int,
    localProductId int,
    deletedAt timestamp NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (studyId) REFERENCES Study(id),
    FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE Question (
    id int NOT NULL AUTO_INCREMENT,
    studyId int,
    label varchar(50) NOT NULL,
    type varchar(50) NOT NULL,
    style varchar(128),
    description text NULL,
    status varchar(20),
    isFilter boolean,
    clientId varchar(255),
    filterLabel varchar(255) NULL,
    deletedAt timestamp NULL,
    sortOrder int(9) NULL,
    createdByImport boolean,
    position varchar(16),
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id)
);

CREATE TABLE QuestionTranslation (
    id int NOT NULL AUTO_INCREMENT,
    questionId int,
    languageCode varchar(5),
    label varchar(50),
    description text,
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (questionId) REFERENCES Question(id)
);

CREATE TABLE QuestionOption(
    id int NOT NULL AUTO_INCREMENT,
    languageCode varchar(5),
    questionId int,
    optionValue varchar(255),
    optionLabel varchar(128),
    isSelected boolean,
    `order` int,
    acceptableAnswer boolean,
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (questionId) REFERENCES Question(id)
);

CREATE TABLE Answer(
    id int NOT NULL AUTO_INCREMENT,
    questionId int(11),
    studyId int(11),
--    respondentId int(11),
    responseId int(11),
    deletedAt timestamp NULL,
    value varchar(512) NULL,
    optionId int(11) NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (questionId) REFERENCES Question(id),
    FOREIGN KEY (studyId) REFERENCES Study(id)
);

CREATE TABLE Respondent(
    id int NOT NULL AUTO_INCREMENT,
    token varchar(100),
    url varchar(100),
    deletedAt timestamp NULL,
    country varchar(64),
    language varchar(16),
    PRIMARY KEY (id)
);

CREATE TABLE Response(
    id int NOT NULL AUTO_INCREMENT,
    respondentId int,
    studyId int,
    language varchar(16),
    startTime datetime,
    endTime datetime,
    productOrder varchar(255),
    winningProductId int,
    complete boolean,
    deletedAt timestamp NULL,
    device varchar(16),
    audienceUuid varchar(64),
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id),
    FOREIGN KEY (respondentId) REFERENCES Respondent(id)
);

CREATE TABLE Interest(
    id int NOT NULL AUTO_INCREMENT,
    responseId int,
    productId int,
    interest boolean,
    deletedAt timestamp NULL,
    considered boolean,
    timeOnScreen varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (responseId) REFERENCES Response(id),
    FOREIGN KEY (productId) REFERENCES Product(id)
);

CREATE TABLE Tradeoff(
    id int NOT NULL AUTO_INCREMENT,
    responseId int,
    productIdWon int,
    productIdLost int,
    deletedAt timestamp NULL,
    timeOnScreen varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (responseId) REFERENCES Response(id),
    FOREIGN KEY (productIdWon) REFERENCES Product(id),
    FOREIGN KEY (productIdLost) REFERENCES Product(id)
);

CREATE TABLE Taxonomy(
    id int NOT NULL AUTO_INCREMENT,
    label varchar (255),
    deletedAt timestamp NULL,
    PRIMARY KEY (id)
);

INSERT INTO Taxonomy (label) VALUES ('studyCategories');
INSERT INTO Taxonomy (label) VALUES ('productCategories');
INSERT INTO Taxonomy (label) VALUES ('productTags');

CREATE TABLE Term(
    id int NOT NULL AUTO_INCREMENT,
    label varchar (255),
    taxonomyId int,
    isFilter boolean default 0,
    isGlobal boolean default 0,
    clientId varchar(255),
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (taxonomyId) REFERENCES Taxonomy(id)
);

CREATE TABLE TermRelations(
    id int NOT NULL AUTO_INCREMENT,
    termId int,
    objectId int,
    objectType varchar (32),
    deletedAt timestamp NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (termId) REFERENCES Term(id)
);

CREATE TABLE Groups(
    id int NOT NULL AUTO_INCREMENT,
    clientId varchar (255),
    label varchar (255),
    deletedAt timestamp NULL,
    PRIMARY KEY (id)
);

CREATE TABLE GroupUsers(
    id int NOT NULL AUTO_INCREMENT,
    groupId int,
    userUuid varchar (255),
    PRIMARY KEY (id)
);

CREATE TABLE ModelAccess(
    id int NOT NULL AUTO_INCREMENT,
    modelId int,
    modelType varchar (32),
    shareId varchar (255),
    originId varchar (255),
    allowInvitation boolean,
    deletedAt timestamp NULL,
    expiredAt timestamp NULL,
    PRIMARY KEY (id)
);

CREATE TABLE AccessKey(
    id int NOT NULL AUTO_INCREMENT,
    `key` text,
    userData text,
    userUuid varchar(255),
    expiredAt datetime DEFAULT NULL,
    forceRefresh boolean,
    `authJwt` text,
    `accountUuid` varchar(255),
    PRIMARY KEY (id)
);


CREATE TABLE Accounts(
    id int NOT NULL AUTO_INCREMENT,
    uuid varchar(64),
    type varchar(64),
    verified tinyint(1),
    ownerUuid varchar(64),
    createdAt timestamp NOT NULL DEFAULT current_timestamp,
    deletedAt timestamp NULL,
    PRIMARY KEY (id)
);

INSERT INTO `Accounts` (`id`, `ownerUuid`, `createdAt`)
VALUES(1, 'client:ffffffff-ffff-4fff-bfff-ffffffffffff', DATE("2018-12-12"));

CREATE TABLE AccountClients(
    id int NOT NULL AUTO_INCREMENT,
    accountId int NOT NULL,
    clientUuid varchar(64),
    PRIMARY KEY (id),
    FOREIGN KEY (accountId) REFERENCES Accounts(id)
);

INSERT INTO `AccountClients` (`id`, `accountId`, `clientUuid`)
VALUES(1, 1, 'client:ffffffff-ffff-4fff-bfff-ffffffffffff');

CREATE TABLE AccountSettings(
    id int NOT NULL AUTO_INCREMENT,
    accountId int NOT NULL,
    `businessName` varchar(255),
    `address` varchar(255),
    `addressTwo` varchar(255),
    `city` varchar(255),
    `zip` varchar(255),
    `state` varchar(255),
    `country` varchar(255),
    `currency` varchar(255),
    `billingEmail` varchar(255),
    `planType` varchar(255),
    `planInterval` varchar(255),
    `usageFrequency` varchar(255),
    `stripeCustomerId` varchar(255),
    `stripeSubscriptionId` varchar(255),
    `stripeUsageSubscriptionId` varchar(255),
    `isTrial` BOOLEAN,
    PRIMARY KEY (id),
    FOREIGN KEY (accountId) REFERENCES Accounts(id)
);

CREATE TABLE AccountSetupQueue(
    id int NOT NULL AUTO_INCREMENT,
    chargifyCustomerId int NOT NULL,
    chargifySubscriptionId int NOT NULL,
    status varchar(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE SampleTemplates(
    id int NOT NULL AUTO_INCREMENT,
    name text,
    provider varchar(100),
    templateId varchar(50),
    languageCode varchar(5),
    incidenceRate float(40,4),
    deletedAt timestamp null,
    description text,
    ageBins TEXT,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

INSERT INTO `SampleTemplates` (`id`, `name`, `provider`, `languageCode`, `templateId`, `updatedAt`, `createdAt`)
VALUES(1, 'test', 'LUCID', 'en_CA', 6004, DATE("2018-12-12"), DATE("2018-12-12"));

CREATE TABLE Provider (
    id int NOT NULL AUTO_INCREMENT,
    name text,
    code varchar(20),
    settings text,
    deletedAt TIMESTAMP null,
    PRIMARY KEY (id)
);

CREATE TABLE StudySample(
    id int NOT NULL AUTO_INCREMENT,
    sampleTemplateId int,
    studyId int,
    sampleSize int,
    languageCode varchar(5),
    providerId int,
    estimatedCostPerRespondent float(20,2),
    deletedAt TIMESTAMP null,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (sampleTemplateId) REFERENCES SampleTemplates(id),
    FOREIGN KEY (studyId) REFERENCES Study(id),
    FOREIGN KEY (providerId) REFERENCES Provider(id)
);

CREATE TABLE Geography (
    id int NOT NULL AUTO_INCREMENT,
    name text,
    deletedAt TIMESTAMP null,
    PRIMARY KEY (id)
);

INSERT INTO Geography (id, name, deletedAt) VALUES (1, 'Canada', null);

CREATE TABLE GeographyLanguage (
    id int NOT NULL AUTO_INCREMENT,
    geographyId int,
    languageCode varchar(5),
    deletedAt TIMESTAMP null,
    PRIMARY KEY (id),
    FOREIGN KEY (geographyId) REFERENCES Geography(id),
    FOREIGN KEY (languageCode) REFERENCES TranslationLanguage(languageCode)
);

INSERT INTO GeographyLanguage (id, geographyId, languageCode, deletedAt) VALUES (1, 1, 'en_CA', null);

CREATE TABLE ProductPrediction(
    id int NOT NULL AUTO_INCREMENT,
    productId int,
    productTranslationId int,
    assetVariationId int,
    upsiideBin varchar(255),
    upsiideCertainty varchar(255),
    deletedAt TIMESTAMP null,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (productId) REFERENCES Product(id),
    FOREIGN KEY (productTranslationId) REFERENCES ProductTranslation(id),
    FOREIGN KEY (assetVariationId) REFERENCES AssetVariation(id)
);

CREATE TABLE StudyGeography (
    id int NOT NULL AUTO_INCREMENT,
    studyId int,
    geographyId int,
    deletedAt timestamp NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (studyId) REFERENCES Study(id),
    FOREIGN KEY (geographyId) REFERENCES Geography(id)
);

CREATE TABLE AppUsage(
    id int NOT NULL AUTO_INCREMENT,
    deletedAt TIMESTAMP null,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    clientUuid varchar(255) NULL,
    component varchar(255) NULL,
    componentId int,
    quantity int,
    discount float(20,2),
    discountType enum('inCents', 'percentage') NULL,
    description text NULL,
    accountId int,
    costInCents int NULL,
    priceInCents int NULL,
    priceCurrency varchar(3) NULL,
    convertedPriceInCents int NULL,
    convertedPriceCurrency varchar(3) NULL,
    convertedAt TIMESTAMP NULL,
    billedAt TIMESTAMP NULL,
    readyToInvoice tinyint(1),
    PRIMARY KEY (id),
    FOREIGN KEY (accountId) REFERENCES Accounts(id)
);

CREATE TABLE Audience (
    id int NOT NULL AUTO_INCREMENT,
    price int,
    currency varchar(3),
    studyId int,
    templateId int,
    sampleTemplateId int,
    lengthOfInterview int,
    incidenceRate int,
    provider varchar(100),
    surveyId int,
    status varchar(15),
    uuid varchar(255),
    deletedAt TIMESTAMP NULL,
    sampleSize int,
    name text,
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id),
    FOREIGN KEY (sampleTemplateId) REFERENCES SampleTemplates(id)
);

INSERT INTO `AccessKey` (`id`, `key`, `userData`, `userUuid`, `expiredAt`)
VALUES(1, 'test.jwt', `key`,'user.uuid', DATE("2048-12-12"));

CREATE TABLE ClientSampleTemplates (
    id int NOT NULL AUTO_INCREMENT,
    price double(40,4),
    currency varchar(3),
    cost double(40,4),
    costCurrency varchar(3),
    clientUuid varchar(255),
    accountUuid varchar(255),
    sampleTemplateId int,
    PRIMARY KEY (id),
    FOREIGN KEY (sampleTemplateId) REFERENCES SampleTemplates(id)
);

INSERT INTO `Accounts` (`id`, `uuid`, `type`, `verified`, `ownerUuid`, `createdAt`, `deletedAt`)
VALUES (1, 'account-uuid', 'test', 1, 'client:ffffffff-ffff-4fff-bfff-ffffffffffff', now(), null);

INSERT INTO `AccountClients` (`clientUuid`, `accountId`)
VALUES ('client:ffffffff-ffff-4fff-bfff-ffffffffffff', 1);

INSERT INTO `AccountSettings` (`id`, `currency`, `accountId`)
VALUES (1, 'usd', 1);

INSERT INTO `ClientSampleTemplates` (`id`, `price`, `currency`, `cost`, `costCurrency`, `clientUuid`, `sampleTemplateId`)
VALUES(1, 1, 'usd', 1, 'usd', 'client:ffffffff-ffff-4fff-bfff-ffffffffffff', 1);

CREATE TABLE PreviewStudy (
    id int NOT NULL AUTO_INCREMENT,
    studyId int(11),
    previewUuid varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (studyId) REFERENCES Study(id)
);
CREATE TABLE AccountFeatures (
    id int NOT NULL AUTO_INCREMENT,
    accountId int(11),
    label varchar(255),
    value varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (accountId) REFERENCES Accounts(id)
);