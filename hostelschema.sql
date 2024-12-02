CREATE DATABASE  IF NOT EXISTS `hosteldatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hosteldatabase`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: hosteldatabase
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendanceId` int NOT NULL AUTO_INCREMENT,
  `studentId` int DEFAULT NULL,
  `roomId` int DEFAULT NULL,
  `blockFloorId` int DEFAULT NULL,
  `blockId` int DEFAULT NULL,
  `checkInDate` date DEFAULT NULL,
  `isPresent` tinyint(1) DEFAULT NULL,
  `wardenId` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  PRIMARY KEY (`attendanceId`),
  UNIQUE KEY `attendance_unq_studentId_date` (`studentId`,`checkInDate`),
  KEY `fk_attendance_wardenId` (`wardenId`),
  KEY `fk_attendance_updatedAt` (`updatedAt`),
  KEY `fk_attendance_updatedBy` (`updatedBy`),
  CONSTRAINT `fk_attendance_studentId` FOREIGN KEY (`studentId`) REFERENCES `student` (`studentId`),
  CONSTRAINT `fk_attendance_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_attendance_wardenId` FOREIGN KEY (`wardenId`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (93,30,76,36,57,'2024-11-03',1,8,'2024-10-21 14:34:35','2024-11-03 13:30:38',NULL),(94,31,77,41,79,'2024-11-03',1,8,'2024-10-21 15:19:49','2024-11-05 09:36:39',NULL),(95,30,76,36,57,'2024-10-20',1,8,'2024-10-21 15:55:02','2024-10-21 15:55:02',NULL),(98,31,77,41,79,'2024-10-01',1,8,'2024-10-21 18:01:01','2024-10-21 18:01:01',NULL),(99,30,76,36,57,'2024-10-31',0,8,'2024-10-31 15:17:52','2024-10-31 15:17:52',NULL),(100,31,77,41,79,'2024-11-01',0,8,'2024-10-31 15:30:03','2024-11-05 09:48:03',NULL),(101,32,77,41,79,'2024-10-31',0,8,'2024-10-31 15:30:03','2024-10-31 15:30:04',NULL),(104,30,76,36,57,'2024-06-05',1,8,'2024-10-31 17:23:08','2024-10-31 17:23:08',NULL),(105,30,76,36,57,'2024-01-02',1,8,'2024-11-01 05:35:07','2024-11-01 05:35:07',NULL),(106,30,76,36,57,'2024-11-02',1,NULL,'2024-11-02 10:20:02','2024-11-02 10:23:22',NULL),(107,31,77,41,79,'2024-11-05',0,8,'2024-11-05 05:56:40','2024-11-05 06:06:13',NULL),(108,32,77,41,79,'2024-11-05',0,8,'2024-11-05 05:56:41','2024-11-05 06:06:13',NULL),(111,30,76,36,57,'2024-11-05',0,8,'2024-11-05 05:58:45','2024-11-05 05:58:45',NULL),(120,30,76,36,57,'2024-10-29',1,8,'2024-11-05 06:06:54','2024-11-05 06:06:54',NULL),(121,31,77,41,79,'2024-10-29',1,8,'2024-11-05 06:09:26','2024-11-05 06:09:26',NULL),(122,32,77,41,79,'2024-10-29',1,8,'2024-11-05 06:09:26','2024-11-05 06:09:26',NULL),(125,31,77,41,79,'2024-10-28',1,8,'2024-11-05 06:12:18','2024-11-05 06:12:18',NULL),(126,32,77,41,79,'2024-10-28',1,8,'2024-11-05 06:12:18','2024-11-05 06:12:18',NULL),(129,30,76,36,57,'2024-10-28',1,8,'2024-11-05 06:14:35','2024-11-05 06:55:49',NULL),(133,33,77,41,79,'2024-11-05',0,8,'2024-11-05 07:01:51','2024-11-05 07:01:51',NULL),(141,32,77,41,79,'2024-11-03',1,8,'2024-11-05 09:36:38','2024-11-05 09:36:40',NULL),(142,33,77,41,79,'2024-11-03',1,8,'2024-11-05 09:36:39','2024-11-05 09:36:40',NULL),(150,32,77,41,79,'2024-11-01',0,8,'2024-11-05 09:48:03','2024-11-05 09:48:04',NULL),(151,33,77,41,79,'2024-11-01',0,8,'2024-11-05 09:48:03','2024-11-05 09:48:04',NULL),(158,31,77,41,79,'2024-11-02',0,8,'2024-11-05 09:49:06','2024-11-29 15:46:28',NULL),(159,32,77,41,79,'2024-11-02',0,8,'2024-11-05 09:49:07','2024-11-29 15:46:29',NULL),(160,33,77,41,79,'2024-11-02',0,8,'2024-11-05 09:49:07','2024-11-05 09:49:07',NULL),(171,33,85,59,86,'2024-11-29',1,8,'2024-11-29 15:46:58','2024-11-29 15:49:24',NULL),(172,40,85,59,86,'2024-11-29',1,8,'2024-11-29 15:46:58','2024-11-29 15:49:25',NULL);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `block`
--

DROP TABLE IF EXISTS `block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `block` (
  `blockId` int NOT NULL AUTO_INCREMENT,
  `blockCode` varchar(255) DEFAULT NULL,
  `blockLocation` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  PRIMARY KEY (`blockId`),
  UNIQUE KEY `blockCode` (`blockCode`),
  KEY `fk_block_deletedBy` (`deletedBy`),
  KEY `fk_block_createdBy` (`createdBy`),
  KEY `fk_block_updatedBy` (`updatedBy`),
  CONSTRAINT `fk_block_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_block_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_block_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `block`
--

LOCK TABLES `block` WRITE;
/*!40000 ALTER TABLE `block` DISABLE KEYS */;
INSERT INTO `block` VALUES (57,'a-block-2024-11-13 23:37:43','aaa',1,'2024-10-09 15:10:10',8,'2024-11-13 18:07:43',8,'2024-11-13 18:07:43',8),(58,'b-block','bb',1,'2024-10-10 04:54:01',8,'2024-10-10 04:54:01',NULL,NULL,NULL),(59,'c-block','cc',1,'2024-10-14 16:01:50',8,'2024-10-14 16:01:50',NULL,NULL,NULL),(60,'d-block2024-10-19 11:46:09','dd',0,'2024-10-16 07:41:57',8,'2024-10-19 06:16:09',NULL,'2024-10-19 06:16:09',8),(61,NULL,'kdff',1,'2024-10-17 14:44:51',8,'2024-10-19 05:49:11',NULL,'2024-10-19 05:49:11',8),(62,NULL,'ffff',1,'2024-10-16 17:47:25',8,'2024-10-19 06:03:04',NULL,'2024-10-19 06:03:04',8),(66,NULL,'dd',1,'2024-10-17 14:09:27',8,'2024-10-19 05:45:06',NULL,'2024-10-19 05:45:06',8),(68,NULL,'dd',1,'2024-10-17 14:49:25',8,'2024-10-19 05:35:15',8,'2024-10-19 05:35:15',8),(69,'2024-10-19 10:10:06','c',1,'2024-10-17 15:04:30',8,'2024-10-19 04:40:06',NULL,'2024-10-19 04:40:06',8),(75,NULL,'cc',1,'2024-10-19 06:02:28',8,'2024-10-19 06:02:33',NULL,'2024-10-19 06:02:33',8),(76,'ss20241019114752','ss',1,'2024-10-19 06:17:47',8,'2024-10-19 06:17:52',NULL,'2024-10-19 06:17:52',8),(77,'ldkd2024-10-19 11:49:07','xd',1,'2024-10-19 06:19:03',8,'2024-10-19 06:19:07',NULL,'2024-10-19 06:19:07',8),(78,'cvv-2024-10-19 11:54:54','vvv',1,'2024-10-19 06:23:51',8,'2024-10-19 06:24:54',NULL,'2024-10-19 06:24:54',8),(79,'h-blockk-2024-11-13 23:40:59','hh',1,'2024-10-19 07:32:58',8,'2024-11-13 18:10:59',8,'2024-11-13 18:10:59',8),(82,'kkd','ff',0,'2024-10-21 15:57:51',8,'2024-10-21 16:13:25',8,NULL,NULL),(83,'kk-2024-11-09 15:48:31','kk',1,'2024-11-01 07:13:08',8,'2024-11-09 10:18:31',NULL,'2024-11-09 10:18:31',8),(84,'mmmm','mm',0,'2024-11-01 07:13:21',8,'2024-11-01 07:13:21',NULL,NULL,NULL),(85,'cc','cc',1,'2024-11-02 06:37:29',8,'2024-11-02 06:37:29',NULL,NULL,NULL),(86,'aaaa','aa',1,'2024-11-02 06:59:18',8,'2024-11-02 06:59:18',NULL,NULL,NULL),(87,'bb-2024-11-15 10:37:50','bbb',1,'2024-11-02 06:59:40',8,'2024-11-15 05:07:50',NULL,'2024-11-15 05:07:50',8),(88,'llls','ss',1,'2024-11-02 07:00:15',8,'2024-11-03 16:57:20',NULL,'2024-11-02 07:00:15',NULL),(89,'hi','jjnjcc',0,'2024-11-10 13:47:48',8,'2024-11-11 10:53:02',8,NULL,NULL),(90,'ablock','north',1,'2024-11-11 10:55:54',8,'2024-11-11 17:59:22',8,NULL,NULL),(91,'f-block-2024-11-17 11:28:19','f',0,'2024-11-11 18:00:08',8,'2024-11-17 05:58:19',NULL,'2024-11-17 05:58:19',8),(92,'mmm-block','122344',0,'2024-11-12 15:03:21',8,'2024-11-12 15:03:21',NULL,NULL,NULL),(93,'kckv-2024-11-13 21:08:56','jkcc',1,'2024-11-12 15:04:00',8,'2024-11-13 15:38:56',NULL,'2024-11-13 15:38:56',8),(94,'jjjg-2024-11-14 22:44:47','jfnfj',1,'2024-11-12 15:05:20',8,'2024-11-14 17:14:47',NULL,'2024-11-14 17:14:47',8),(95,'i-block-2024-11-14 22:57:57','cc',1,'2024-11-12 15:07:13',8,'2024-11-14 17:27:57',NULL,'2024-11-14 17:27:57',8),(96,'kgi-block','ki',1,'2024-11-12 18:32:17',8,'2024-11-12 18:32:17',NULL,NULL,NULL),(97,'kckc-2024-11-14 22:45:17','kkc',1,'2024-11-13 11:08:20',8,'2024-11-14 17:15:17',NULL,'2024-11-14 17:15:17',8),(98,'kkks','kss',1,'2024-11-13 11:08:47',8,'2024-11-13 11:08:47',NULL,NULL,NULL),(99,'kllllllll','llllll',1,'2024-11-13 11:09:34',8,'2024-11-13 11:09:34',NULL,NULL,NULL),(100,'jdndjd-2024-11-14 22:44:39','jndj',0,'2024-11-13 11:10:34',8,'2024-11-14 17:14:39',NULL,'2024-11-14 17:14:39',8),(101,'ooooppppppp-2024-11-14 22:41:11','dvkm',1,'2024-11-13 11:13:51',8,'2024-11-14 17:11:11',NULL,'2024-11-14 17:11:11',8),(102,'kkdkddkk-2024-11-14 22:51:04','kkkkkkkkkkkkkk0',0,'2024-11-13 11:14:29',8,'2024-11-14 17:21:04',8,'2024-11-14 17:21:04',8),(103,'jjiij-2024-11-14 22:45:06','jjji4',1,'2024-11-13 18:21:51',8,'2024-11-14 17:15:06',8,'2024-11-14 17:15:06',8),(104,'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk-2024-11-14 20:24:38','kkkkkkkkkkkkkkkk',1,'2024-11-13 18:25:35',8,'2024-11-14 14:54:38',NULL,'2024-11-14 14:54:38',8),(106,'aaa-2024-11-14 22:44:54','as',1,'2024-11-14 16:17:29',8,'2024-11-14 17:14:54',8,'2024-11-14 17:14:54',8),(108,'aaaaaaaaaaass-2024-11-14 22:38:35','aa',1,'2024-11-14 16:17:42',8,'2024-11-14 17:08:35',8,'2024-11-14 17:08:35',8),(109,'aaaaaaaaaaak-2024-11-14 22:36:07','ad',1,'2024-11-14 16:18:18',8,'2024-11-14 17:06:07',8,'2024-11-14 17:06:07',8),(110,'aaaaaj','aj',1,'2024-11-14 16:18:27',8,'2024-11-14 16:19:35',8,NULL,NULL),(111,'aaaaaaaaak-2024-11-14 22:32:28','a',1,'2024-11-14 16:18:38',8,'2024-11-14 17:02:28',8,'2024-11-14 17:02:28',8),(112,'kkkk-2024-11-14 22:32:03','kk',1,'2024-11-14 16:58:26',8,'2024-11-14 17:02:03',NULL,'2024-11-14 17:02:03',8),(113,'as1-2024-11-15 10:34:55','as1',1,'2024-11-14 20:16:58',8,'2024-11-15 05:04:55',8,'2024-11-15 05:04:55',8),(114,'ki0','ki008',1,'2024-11-14 20:34:04',8,'2024-11-17 09:11:29',8,NULL,NULL),(115,'ood-2024-11-15 10:33:30','dd',1,'2024-11-14 20:35:59',8,'2024-11-15 05:03:30',NULL,'2024-11-15 05:03:30',8),(116,'kjj','kk',0,'2024-11-17 11:04:25',8,'2024-11-17 11:04:25',NULL,NULL,NULL),(117,'jjjj000','jjjjjj99',1,'2024-11-18 17:07:50',8,'2024-11-18 17:07:50',NULL,NULL,NULL),(118,'j2','jj3',1,'2024-11-18 17:08:13',8,'2024-11-18 17:08:13',NULL,NULL,NULL),(119,'jfjf','fjjf',1,'2024-11-18 17:09:49',8,'2024-11-18 17:09:49',NULL,NULL,NULL),(120,'jcjcj','cjcjj',1,'2024-11-18 17:10:12',8,'2024-11-18 17:10:12',NULL,NULL,NULL),(121,'mmcmcvmm','mvmv',1,'2024-11-18 17:13:29',8,'2024-11-18 17:13:29',NULL,NULL,NULL),(122,'mckkfd','cm v',0,'2024-11-18 17:14:40',8,'2024-11-18 17:14:40',NULL,NULL,NULL),(123,'ccfkfjif','vmvmv',1,'2024-11-18 17:15:02',8,'2024-11-18 17:15:02',NULL,NULL,NULL),(124,'mkkl','jjj',1,'2024-11-18 17:19:22',8,'2024-11-18 17:19:22',NULL,NULL,NULL),(125,'djdjd','fjjff',1,'2024-11-18 17:20:35',8,'2024-11-18 17:20:35',NULL,NULL,NULL),(126,'dmmf','vmvmv',1,'2024-11-18 17:21:35',8,'2024-11-18 17:21:35',NULL,NULL,NULL),(127,'kkcc','kjvkv',1,'2024-11-18 17:22:09',8,'2024-11-18 17:22:09',NULL,NULL,NULL),(128,'m, m,cc',',,mm',1,'2024-11-18 17:23:22',8,'2024-11-18 17:23:22',NULL,NULL,NULL),(129,',mcm,cmc,,d',',mm,df',1,'2024-11-18 17:25:31',8,'2024-11-18 17:25:31',NULL,NULL,NULL),(130,'ckmcklf','dknfdk',1,'2024-11-18 17:26:55',8,'2024-11-18 17:26:55',NULL,NULL,NULL),(131,'mcmc','mvmv',1,'2024-11-18 17:27:22',8,'2024-11-18 17:27:22',NULL,NULL,NULL),(132,',mcm,c','vmmv',1,'2024-11-18 17:29:28',8,'2024-11-18 17:29:28',NULL,NULL,NULL),(133,'cmcmvmv','mv',1,'2024-11-18 17:29:49',8,'2024-11-18 17:29:49',NULL,NULL,NULL),(134,'kcmc','cmmc',1,'2024-11-18 17:30:36',8,'2024-11-18 17:30:36',NULL,NULL,NULL),(135,'kkkoo','kkk',1,'2024-11-19 05:44:58',8,'2024-11-19 05:45:15',8,NULL,NULL),(136,'kkkgggh','kk',NULL,'2024-11-19 13:32:09',8,'2024-11-19 13:32:09',NULL,NULL,NULL),(137,'jjj','hh',NULL,'2024-11-19 13:55:31',8,'2024-11-19 13:55:31',NULL,NULL,NULL),(139,'hjh','kjj',NULL,'2024-11-19 13:56:28',8,'2024-11-19 13:56:28',NULL,NULL,NULL),(140,'hkjj','nbn',NULL,'2024-11-19 13:56:59',8,'2024-11-19 13:56:59',NULL,NULL,NULL),(141,'bbhhhj','b',NULL,'2024-11-19 13:57:53',8,'2024-11-19 13:57:53',NULL,NULL,NULL),(142,'bhjbjjk','bhbj',NULL,'2024-11-19 13:58:21',8,'2024-11-19 13:58:21',NULL,NULL,NULL),(143,'xhjxjx','cncj',NULL,'2024-11-19 13:58:40',8,'2024-11-19 13:58:40',NULL,NULL,NULL),(144,'cjcj','cmbcn',NULL,'2024-11-19 14:07:49',8,'2024-11-19 14:07:49',NULL,NULL,NULL),(145,'ddd','dd',NULL,'2024-11-19 14:09:50',8,'2024-11-19 14:09:50',NULL,NULL,NULL),(146,'ncc','cc',NULL,'2024-11-19 14:12:22',8,'2024-11-19 14:12:22',NULL,NULL,NULL),(147,'mncmc','ccc',NULL,'2024-11-19 14:13:11',8,'2024-11-19 14:13:11',NULL,NULL,NULL),(148,' c mvvmvm','mv mv',NULL,'2024-11-19 14:13:55',8,'2024-11-19 14:13:55',NULL,NULL,NULL),(149,'cmcm','mcv',1,'2024-11-19 14:15:46',8,'2024-11-19 14:15:46',NULL,NULL,NULL),(151,'mcc','kvc',1,'2024-11-19 14:16:37',8,'2024-11-19 14:16:37',NULL,NULL,NULL),(152,'kccc','vvvkvkv',1,'2024-11-19 14:17:41',8,'2024-11-19 14:17:41',NULL,NULL,NULL),(153,'kccc8','kfjfff',1,'2024-11-19 14:17:59',8,'2024-11-26 07:03:21',8,NULL,NULL),(154,'nsjjmffff-2024-11-28 11:40:06','kjkvvdllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',1,'2024-11-19 14:22:26',8,'2024-11-28 06:10:06',8,'2024-11-28 06:10:06',8),(155,'jhbhbddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd-2024-11-28 11:39:39','mc',1,'2024-11-26 15:27:50',8,'2024-11-28 06:09:39',8,'2024-11-28 06:09:39',8),(156,'ckkfkff','kfkfkf',1,'2024-11-27 05:15:24',8,'2024-11-27 05:15:24',NULL,NULL,NULL),(157,'ckkfkff             -2024-11-27 21:34:17','2',1,'2024-11-27 16:01:38',8,'2024-11-27 16:04:17',NULL,'2024-11-27 16:04:17',8),(158,'kccc8                             0','nd',1,'2024-11-27 16:08:49',8,'2024-11-27 16:08:49',NULL,NULL,NULL);
/*!40000 ALTER TABLE `block` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blockfloor`
--

DROP TABLE IF EXISTS `blockfloor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blockfloor` (
  `blockFloorId` int NOT NULL AUTO_INCREMENT,
  `blockId` int DEFAULT NULL,
  `floorNumber` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  PRIMARY KEY (`blockFloorId`),
  UNIQUE KEY `unique_block_floor` (`blockId`,`floorNumber`),
  KEY `fk_blockfloor_deletedBy` (`deletedBy`),
  KEY `fk_blockfloor_updatedBy` (`updatedBy`),
  KEY `fk_blockfloor_createdBy` (`createdBy`),
  CONSTRAINT `fk_blockfloor_blockId` FOREIGN KEY (`blockId`) REFERENCES `block` (`blockId`),
  CONSTRAINT `fk_blockfloor_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_blockfloor_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_blockfloor_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blockfloor`
--

LOCK TABLES `blockfloor` WRITE;
/*!40000 ALTER TABLE `blockfloor` DISABLE KEYS */;
INSERT INTO `blockfloor` VALUES (36,57,'1',1,'2024-10-21 09:38:42',8,'2024-10-21 09:38:42',NULL,NULL,NULL),(38,57,'2',1,'2024-10-21 09:39:02',8,'2024-10-21 09:39:02',NULL,NULL,NULL),(40,57,'3',0,'2024-10-21 10:07:45',8,'2024-10-21 10:07:45',NULL,NULL,NULL),(41,79,'1',1,'2024-10-21 10:16:29',8,'2024-10-21 10:16:29',NULL,NULL,NULL),(45,79,'2',1,'2024-11-11 05:13:55',8,'2024-11-11 05:13:55',NULL,NULL,NULL),(46,57,'4',1,'2024-11-11 05:13:55',8,'2024-11-11 05:37:10',NULL,'2024-11-11 05:37:10',8),(47,57,'7',0,'2024-11-11 17:53:25',8,'2024-11-11 17:53:47',8,NULL,NULL),(48,57,'19',1,'2024-11-12 14:57:56',8,'2024-11-12 14:57:56',NULL,NULL,NULL),(49,57,'90',0,'2024-11-12 15:02:30',8,'2024-11-12 15:02:30',NULL,NULL,NULL),(50,57,'44',1,'2024-11-12 15:07:35',8,'2024-11-12 15:07:35',NULL,NULL,NULL),(51,57,'99',1,'2024-11-12 15:07:47',8,'2024-11-12 15:07:47',NULL,NULL,NULL),(52,57,'98',1,'2024-11-12 15:09:45',8,'2024-11-12 15:09:45',NULL,NULL,NULL),(53,79,'88',1,'2024-11-12 15:10:22',8,'2024-11-12 15:10:22',NULL,NULL,NULL),(54,57,'888',1,'2024-11-12 15:11:39',8,'2024-11-12 15:11:39',NULL,NULL,NULL),(55,79,'909',1,'2024-11-13 11:05:48',8,'2024-11-13 11:05:48',NULL,NULL,NULL),(56,57,'808',1,'2024-11-13 11:07:12',8,'2024-11-13 11:07:12',NULL,NULL,NULL),(57,57,'455',1,'2024-11-13 11:07:48',8,'2024-11-13 11:07:48',NULL,NULL,NULL),(58,90,'3',1,'2024-11-13 18:33:02',8,'2024-11-13 18:33:02',NULL,NULL,NULL),(59,86,'11',1,'2024-11-13 18:33:43',8,'2024-11-13 18:33:43',NULL,NULL,NULL),(60,86,'876',1,'2024-11-14 08:13:08',8,'2024-11-14 08:13:08',NULL,NULL,NULL),(61,110,'1',1,'2024-11-14 16:47:08',8,'2024-11-14 16:47:08',NULL,NULL,NULL),(62,99,'99',1,'2024-11-14 17:15:46',8,'2024-11-14 17:15:46',NULL,NULL,NULL),(64,59,'999',1,'2024-11-14 19:16:29',8,'2024-11-14 19:16:29',NULL,NULL,NULL),(65,85,'22',1,'2024-11-14 19:17:25',8,'2024-11-14 19:17:25',NULL,NULL,NULL),(66,85,'1',1,'2024-11-14 19:27:00',8,'2024-11-14 19:27:00',NULL,NULL,NULL),(67,85,'11',1,'2024-11-14 19:27:13',8,'2024-11-14 19:27:13',NULL,NULL,NULL),(68,85,'3',1,'2024-11-14 19:27:29',8,'2024-11-14 19:27:29',NULL,NULL,NULL),(69,85,'55',1,'2024-11-14 19:27:42',8,'2024-11-14 19:27:42',NULL,NULL,NULL),(70,85,'123',1,'2024-11-14 19:28:26',8,'2024-11-14 19:28:26',NULL,NULL,NULL),(71,86,'1290',1,'2024-11-14 19:38:13',8,'2024-11-14 20:32:05',8,NULL,NULL),(74,86,'770',1,'2024-11-14 20:25:27',8,'2024-11-14 20:25:27',NULL,NULL,NULL),(75,114,'80',1,'2024-11-14 20:52:46',8,'2024-11-14 20:53:02',8,NULL,NULL),(76,114,'89',1,'2024-11-14 20:53:48',8,'2024-11-14 20:53:48',NULL,NULL,NULL),(77,96,'855',1,'2024-11-14 20:54:27',8,'2024-11-15 05:10:21',8,NULL,NULL),(79,86,'59',1,'2024-11-15 07:20:58',8,'2024-11-15 07:21:09',8,NULL,NULL),(80,86,'399',1,'2024-11-17 05:42:46',8,'2024-11-17 09:06:15',8,NULL,NULL),(81,114,'766-2024-11-19 01:15:19',1,'2024-11-17 09:06:27',8,'2024-11-18 19:45:19',NULL,'2024-11-18 19:45:19',8),(82,85,'484',0,'2024-11-19 14:25:38',8,'2024-11-19 14:25:48',8,NULL,NULL),(83,58,'11',1,'2024-11-22 09:54:02',NULL,'2024-11-22 09:54:02',NULL,NULL,NULL),(84,58,'19',1,'2024-11-26 10:41:38',8,'2024-11-26 10:41:38',NULL,NULL,NULL),(85,58,'111',1,'2024-11-26 10:43:01',8,'2024-11-26 10:43:01',NULL,NULL,NULL),(86,58,'444554',1,'2024-11-26 10:44:00',8,'2024-11-26 10:44:00',NULL,NULL,NULL),(87,58,'99484',1,'2024-11-26 11:00:47',8,'2024-11-26 11:00:47',NULL,NULL,NULL);
/*!40000 ALTER TABLE `blockfloor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course`
--

DROP TABLE IF EXISTS `course`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course` (
  `courseId` int NOT NULL AUTO_INCREMENT,
  `courseName` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  PRIMARY KEY (`courseId`),
  UNIQUE KEY `UC_course_courseName` (`courseName`),
  KEY `fk_course_updatedBy` (`updatedBy`),
  KEY `fk_course_createdBy` (`createdBy`),
  KEY `fk_course_deletedBy` (`deletedBy`),
  CONSTRAINT `fk_course_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_course_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_course_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course`
--

LOCK TABLES `course` WRITE;
/*!40000 ALTER TABLE `course` DISABLE KEYS */;
INSERT INTO `course` VALUES (1,'jk','2024-08-22 14:19:53',NULL,'2024-11-17 16:06:54',8,'2024-11-17 16:06:54',8),(4,'BSC','2024-08-22 14:19:53',NULL,'2024-09-19 15:29:47',NULL,'2024-09-19 15:29:47',8),(5,'BBA','2024-08-22 14:19:53',NULL,'2024-09-11 14:54:10',NULL,'2024-09-11 14:54:10',8),(6,'BCOM','2024-08-22 14:19:53',NULL,'2024-09-13 07:35:11',NULL,'2024-09-13 07:35:11',8),(7,'BSC.IT','2024-08-22 14:19:53',NULL,'2024-09-19 15:44:03',NULL,'2024-09-19 15:44:03',8),(8,'djdj','2024-08-22 14:19:53',NULL,'2024-09-11 15:55:47',NULL,'2024-09-11 15:55:47',8),(9,'dnnd','2024-08-22 14:19:53',NULL,'2024-09-19 15:46:35',NULL,'2024-09-19 15:46:35',42),(10,'nncc-2024-11-17 22:15:11','2024-08-30 05:05:08',NULL,'2024-11-17 16:45:11',6,'2024-11-17 16:45:11',8),(12,'BCOM.baaaa','2024-08-30 05:24:46',NULL,'2024-09-19 15:54:37',42,NULL,NULL),(13,'msc.sc','2024-08-30 05:28:09',8,'2024-08-30 05:28:09',NULL,NULL,NULL),(14,'nn-2024-11-17 22:17:56','2024-08-30 15:17:18',8,'2024-11-17 16:47:56',NULL,'2024-11-17 16:47:56',8),(15,'bdm,','2024-08-30 15:17:34',8,'2024-09-13 07:35:15',NULL,'2024-09-13 07:35:15',8),(16,'hdjdnmm','2024-08-30 15:17:42',8,'2024-09-14 03:43:49',8,NULL,NULL),(17,'ii','2024-08-30 15:21:25',8,'2024-09-11 13:08:11',8,NULL,NULL),(18,'bscit','2024-08-30 15:37:18',8,'2024-09-13 07:36:02',NULL,'2024-09-13 07:36:02',8),(19,'dnf','2024-08-30 15:37:54',8,'2024-09-19 15:57:55',NULL,'2024-09-19 15:57:55',42),(20,'fjfnkkkkk','2024-08-30 15:38:03',8,'2024-09-19 15:58:02',42,NULL,NULL),(21,'ddnd','2024-08-30 15:39:58',8,'2024-09-19 15:44:36',NULL,'2024-09-19 15:44:36',8),(22,'nnd','2024-08-30 15:41:07',8,'2024-08-30 15:44:40',NULL,NULL,NULL),(23,'lk','2024-08-30 15:45:02',8,'2024-08-31 05:21:22',8,NULL,NULL),(24,'ll','2024-08-30 15:45:15',8,'2024-08-30 17:51:11',8,'2024-08-30 17:51:11',8),(25,'','2024-08-30 15:49:06',8,'2024-09-11 14:11:36',NULL,'2024-09-11 14:11:36',8),(26,' ','2024-08-30 15:49:33',8,'2024-09-11 14:11:59',NULL,'2024-09-11 14:11:59',8),(27,'ww','2024-08-30 16:38:18',8,'2024-09-11 14:12:34',8,'2024-09-11 14:12:34',8),(28,'mnmnmcmcmc','2024-09-11 06:38:45',23,'2024-09-11 06:38:45',NULL,NULL,NULL),(29,'11','2024-09-11 06:40:46',23,'2024-09-11 14:15:34',NULL,'2024-09-11 14:15:34',8),(30,'abcdefjk','2024-09-11 07:14:18',23,'2024-09-13 07:34:37',NULL,'2024-09-13 07:34:37',8),(31,'mnbvcvxz','2024-09-11 09:40:27',23,'2024-09-11 09:40:27',NULL,NULL,NULL),(32,'cjkvbk','2024-09-11 10:31:18',16,'2024-09-19 15:57:33',NULL,'2024-09-19 15:57:33',42),(33,'vhbjk','2024-09-11 10:34:27',23,'2024-09-18 15:49:09',NULL,'2024-09-18 15:49:09',8),(34,'jkbnk','2024-09-11 15:21:25',23,'2024-09-11 15:21:25',NULL,NULL,NULL),(35,'kmvlb','2024-09-13 06:05:59',20,'2024-09-13 06:05:59',NULL,NULL,NULL),(36,'kk','2024-09-19 04:29:19',33,'2024-09-19 04:29:19',NULL,NULL,NULL),(39,'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjhhhhhhhhhhhh','2024-09-19 12:32:03',9,'2024-09-19 12:32:03',NULL,NULL,NULL),(40,'jjjjjjjjjjjjjjjjjjjjjjjjjj','2024-09-19 12:32:53',9,'2024-09-19 12:32:53',NULL,NULL,NULL),(41,'wwwwwwwwwwwwwwwwwwwww','2024-09-19 12:33:53',9,'2024-09-19 12:33:53',NULL,NULL,NULL),(47,'testt','2024-09-19 13:06:51',9,'2024-09-24 06:55:18',8,NULL,NULL),(48,'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk','2024-09-19 13:20:08',8,'2024-09-19 13:20:08',NULL,NULL,NULL),(49,'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk','2024-09-19 14:50:37',8,'2024-09-19 14:50:37',NULL,NULL,NULL),(50,'lllllllllllllllllllllllllooo','2024-09-19 16:45:25',42,'2024-09-29 06:22:57',8,NULL,NULL),(51,'ooooooooooooo','2024-09-19 16:47:02',42,'2024-09-19 16:47:02',NULL,NULL,NULL),(52,'kkkkkkkkkkkkkkkkkkkklllllllllllll','2024-09-19 17:08:50',8,'2024-09-19 17:08:50',NULL,NULL,NULL),(53,'jeeva','2024-09-19 17:29:37',8,'2024-09-19 17:29:37',NULL,NULL,NULL),(54,'klo','2024-09-19 17:31:49',42,'2024-11-17 16:58:51',8,NULL,NULL),(55,'ppppppppppppp','2024-09-19 17:37:30',8,'2024-09-22 06:01:52',8,NULL,NULL),(56,'bbaaaaa','2024-09-19 17:37:53',8,'2024-09-19 17:56:52',8,NULL,NULL),(57,'aaaaaaaaaaaaaaaaaaaaa','2024-09-19 17:55:46',8,'2024-09-19 17:55:46',NULL,NULL,NULL),(58,'aadddddd','2024-09-19 17:56:18',8,'2024-09-29 06:49:54',8,NULL,NULL),(59,'aaaassssssssssssslllll','2024-09-19 18:01:04',8,'2024-09-19 18:36:14',8,NULL,NULL),(60,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbb','2024-09-20 10:52:02',8,'2024-09-20 10:52:20',NULL,'2024-09-20 10:52:20',8),(61,'222200','2024-09-20 17:22:44',8,'2024-09-22 06:01:41',8,NULL,NULL),(62,'zz','2024-09-20 17:23:24',8,'2024-09-29 06:23:57',8,NULL,NULL),(63,'asdfg','2024-09-20 17:24:32',8,'2024-09-20 17:24:32',NULL,NULL,NULL),(64,'hhhh','2024-09-20 17:28:11',8,'2024-09-20 17:28:11',NULL,NULL,NULL),(65,'hhhhhhhhkkkk','2024-09-20 17:34:34',8,'2024-09-20 17:34:34',NULL,NULL,NULL),(66,'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii','2024-09-20 17:42:18',8,'2024-09-20 17:42:18',NULL,NULL,NULL),(67,'kkkkkkkkkkkkkkkkkkkkkkkkllllllll','2024-09-20 17:49:55',8,'2024-09-20 17:50:39',8,NULL,NULL),(68,'hhiiiiii','2024-09-21 11:03:51',8,'2024-09-21 11:03:51',NULL,NULL,NULL),(69,'assss','2024-09-21 11:11:07',8,'2024-09-21 11:11:07',NULL,NULL,NULL),(70,'kkkkkkkkkk','2024-09-22 05:57:24',8,'2024-09-22 05:57:24',NULL,NULL,NULL),(71,'asd','2024-09-22 06:01:24',8,'2024-09-22 06:01:24',NULL,NULL,NULL),(72,'qqqqqqq','2024-09-22 06:04:57',8,'2024-09-22 06:04:57',NULL,NULL,NULL),(73,'yyyyy4','2024-09-22 06:06:59',8,'2024-09-29 06:24:17',8,NULL,NULL),(74,'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww','2024-09-22 06:19:24',8,'2024-09-22 06:19:24',NULL,NULL,NULL),(75,'qqqqqqqqqqqqqqqqqqqqqqqrrrrrrrr','2024-09-22 06:22:20',8,'2024-09-22 06:22:20',NULL,NULL,NULL),(76,'ff2','2024-09-22 06:27:58',8,'2024-10-02 07:42:54',8,NULL,NULL),(77,'hnjk','2024-09-22 06:39:29',8,'2024-09-22 06:39:29',NULL,NULL,NULL),(78,'jjjjjjjkjkkkkkkkkkk','2024-09-22 06:44:35',8,'2024-09-22 06:44:35',NULL,NULL,NULL),(79,'rrrrrrrrrrrrssssssssss2000000','2024-09-22 07:13:00',8,'2024-09-22 07:13:00',NULL,NULL,NULL),(80,'hello','2024-09-22 07:18:21',8,'2024-09-22 07:18:21',NULL,NULL,NULL),(81,'hgj','2024-09-23 10:52:04',8,'2024-09-23 10:52:04',NULL,NULL,NULL),(82,'aaaaaaaaaaassssssssssdddddddd','2024-09-23 10:53:19',8,'2024-09-23 10:53:19',NULL,NULL,NULL),(83,'asdfghhhhhhhhhhhhhhhhhhhhh','2024-09-23 13:40:41',8,'2024-09-23 13:40:41',NULL,NULL,NULL),(84,'aaaaaaaaaaaaassssssssssssssssddddddd','2024-09-23 13:41:40',8,'2024-09-23 13:41:40',NULL,NULL,NULL),(85,'wwwwwweeeeee','2024-09-23 13:59:17',8,'2024-09-23 13:59:17',NULL,NULL,NULL),(86,'ramm','2024-09-23 14:09:24',8,'2024-09-23 14:09:24',NULL,NULL,NULL),(87,'ooooop','2024-09-23 14:25:49',8,'2024-09-23 14:25:49',NULL,NULL,NULL),(88,'oooii','2024-09-23 15:06:22',8,'2024-09-23 15:06:22',NULL,NULL,NULL),(89,'pppppuuuu','2024-09-23 15:10:25',8,'2024-09-23 15:10:25',NULL,NULL,NULL),(90,'qqqqqqqqqqqqqqqpppppppp','2024-09-23 15:11:45',8,'2024-09-24 15:49:52',8,NULL,NULL),(91,'aqaqqqqqqqqqqqq','2024-09-23 15:14:10',8,'2024-09-26 15:14:19',NULL,'2024-09-26 15:14:19',8),(92,'abcd','2024-09-24 14:34:06',8,'2024-09-26 16:58:35',8,NULL,NULL),(93,'jjjjjjjjjjjjjpp','2024-09-24 16:46:20',8,'2024-09-26 10:50:43',8,'2024-09-26 10:50:43',8),(94,'aaaaaaaaaaaaaaaaaaaaaaaaaaaadddddddddddd','2024-09-26 17:04:15',8,'2024-09-26 17:04:15',NULL,NULL,NULL),(95,'zzzzzzaaa','2024-09-26 17:04:39',8,'2024-11-17 16:06:06',8,'2024-11-17 16:06:06',8),(96,'mmmmkk','2024-09-26 17:04:52',8,'2024-10-02 05:00:16',42,NULL,NULL),(97,'hi','2024-09-27 13:12:37',8,'2024-09-27 14:30:34',NULL,'2024-09-27 14:30:34',8),(98,'iii-2024-11-17 22:19:29','2024-09-27 14:31:08',8,'2024-11-17 16:49:29',8,'2024-11-17 16:49:29',8),(99,'asdfabd','2024-09-29 06:24:31',8,'2024-09-29 06:24:31',NULL,NULL,NULL),(100,'aqqqq','2024-09-29 06:50:21',8,'2024-09-29 06:50:21',NULL,NULL,NULL),(101,'asasasasas22','2024-09-29 11:25:49',8,'2024-09-29 11:25:59',8,NULL,NULL),(102,'sjdnvaaaaaaaaaaaaaaa','2024-09-30 09:44:13',8,'2024-10-02 07:52:40',8,NULL,NULL),(103,'sass','2024-10-02 07:45:25',8,'2024-10-02 13:26:12',8,NULL,NULL),(104,'hhii0','2024-10-02 14:27:00',8,'2024-11-17 14:53:27',8,NULL,NULL),(105,'hkjkd','2024-11-01 05:50:15',8,'2024-11-01 05:50:15',NULL,NULL,NULL),(106,'kkkkkkkkkkjjjjjjjjj7jjjj66666','2024-11-17 15:42:26',8,'2024-11-17 16:05:35',8,NULL,NULL),(107,'iiioo','2024-11-17 16:50:31',8,'2024-11-17 16:59:14',8,NULL,NULL),(108,'kkkkkkkkkkkkkkkkkkkkkkkkkkkkiiiiiii8','2024-11-17 16:59:23',8,'2024-11-18 11:13:54',8,NULL,NULL),(109,'kkk','2024-11-24 07:36:08',8,'2024-11-26 16:10:34',8,NULL,NULL),(110,'kjhjhhhj','2024-11-26 15:29:41',8,'2024-11-26 15:29:51',8,NULL,NULL),(111,'jjjjjjjjjjjjjjjjjjjjj','2024-11-26 15:29:58',8,'2024-11-26 15:29:58',NULL,NULL,NULL),(112,'1234fgh-2024-11-26 21:00:21','2024-11-26 15:30:13',8,'2024-11-26 15:30:21',NULL,'2024-11-26 15:30:21',8);
/*!40000 ALTER TABLE `course` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `roomId` int NOT NULL AUTO_INCREMENT,
  `blockFloorId` int DEFAULT NULL,
  `blockId` int DEFAULT NULL,
  `roomNumber` varchar(255) DEFAULT NULL,
  `roomCapacity` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT NULL,
  `isAirConditioner` tinyint(1) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  PRIMARY KEY (`roomId`),
  UNIQUE KEY `unique_room` (`blockId`,`blockFloorId`,`roomNumber`),
  KEY `fk_room_blockFloorId` (`blockFloorId`),
  KEY `fk_room_deletedBy` (`deletedBy`),
  KEY `fk_room_updatedBy` (`updatedBy`),
  KEY `fk_room_createdBy` (`createdBy`),
  CONSTRAINT `fk_room_blockFloorId` FOREIGN KEY (`blockFloorId`) REFERENCES `blockfloor` (`blockFloorId`),
  CONSTRAINT `fk_room_blockId` FOREIGN KEY (`blockId`) REFERENCES `block` (`blockId`),
  CONSTRAINT `fk_room_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_room_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_room_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (71,36,57,'4',4,0,1,'2024-10-21 09:46:49',NULL,'2024-11-13 17:45:13',NULL,'2024-11-13 17:45:13',8),(73,36,57,'3',330,1,1,'2024-10-21 09:47:28',NULL,'2024-11-17 08:18:41',8,'2024-11-17 08:18:41',8),(74,36,57,'13-2024-11-19 01:16:11',2,1,1,'2024-10-21 11:11:32',8,'2024-11-18 19:46:11',8,'2024-11-18 19:46:11',8),(76,36,57,'9-2024-11-26 21:25:39',3,1,1,'2024-10-21 13:45:28',8,'2024-11-26 15:55:39',NULL,'2024-11-26 15:55:39',8),(77,41,79,'3',4,1,1,'2024-10-21 15:18:13',8,'2024-11-17 08:24:37',NULL,'2024-11-17 08:24:37',8),(78,41,79,'44',4,0,1,'2024-10-21 16:14:55',8,'2024-11-12 17:53:30',NULL,'2024-11-12 17:53:30',8),(79,54,57,'11-2024-11-26 21:25:45',11,1,1,'2024-11-12 17:55:01',8,'2024-11-26 15:55:45',NULL,'2024-11-26 15:55:45',8),(80,48,57,'18',7,1,1,'2024-11-13 10:51:32',8,'2024-11-17 08:24:28',NULL,'2024-11-17 08:24:28',8),(81,52,57,'99-2024-11-26 21:25:57',6,1,1,'2024-11-13 11:16:20',8,'2024-11-26 15:55:57',NULL,'2024-11-26 15:55:57',8),(82,57,57,'12-2024-11-26 21:25:52',12,1,1,'2024-11-13 11:20:32',8,'2024-11-26 15:55:52',NULL,'2024-11-26 15:55:52',8),(83,38,57,'988-2024-11-26 21:26:02',44,1,0,'2024-11-13 11:22:03',8,'2024-11-26 15:56:02',NULL,'2024-11-26 15:56:02',8),(84,55,79,'77-2024-11-26 21:25:17',700000000,0,1,'2024-11-13 11:22:54',8,'2024-11-26 15:55:17',8,'2024-11-26 15:55:17',8),(85,59,86,'12',1,1,1,'2024-11-15 05:55:06',8,'2024-11-27 14:44:11',8,NULL,NULL),(86,59,86,'88665-2024-11-19 01:50:52',6,1,1,'2024-11-17 11:10:14',8,'2024-11-18 20:20:52',8,'2024-11-18 20:20:52',8),(87,59,86,'441-2024-11-26 20:18:17',0,1,1,'2024-11-19 14:28:59',8,'2024-11-26 14:48:17',8,'2024-11-26 14:48:17',8),(89,83,58,'12',12,1,1,'2024-11-22 09:55:17',8,'2024-11-26 15:50:51',8,NULL,NULL),(90,83,58,'17-2024-11-26 19:51:46',4,1,1,'2024-11-26 14:21:03',8,'2024-11-26 14:21:46',NULL,'2024-11-26 14:21:46',8);
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `studentId` int NOT NULL AUTO_INCREMENT,
  `roomId` int DEFAULT NULL,
  `blockFloorId` int DEFAULT NULL,
  `blockId` int DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `registerNumber` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `courseId` int DEFAULT NULL,
  `joinedDate` date DEFAULT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `emailId` varchar(255) NOT NULL,
  `fatherName` varchar(255) DEFAULT NULL,
  `fatherNumber` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `otpAttempt` int DEFAULT NULL,
  `otpTiming` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  PRIMARY KEY (`studentId`,`emailId`),
  UNIQUE KEY `UC_student_phoneNumber` (`phoneNumber`),
  UNIQUE KEY `UC_student_fatherNumber` (`fatherNumber`),
  UNIQUE KEY `UC_student_registerNumber` (`registerNumber`),
  KEY `fk_studenId_roomId` (`roomId`),
  KEY `fk_studenId_blockFloorId` (`blockFloorId`),
  KEY `fk_studentId_blockId` (`blockId`),
  KEY `fk_studentId_courseId` (`courseId`),
  KEY `fk_student_deletedBy` (`deletedBy`),
  KEY `fk_student_createdBy` (`createdBy`),
  KEY `fk_student_updatedBy` (`updatedBy`),
  CONSTRAINT `fk_studenId_blockFloorId` FOREIGN KEY (`blockFloorId`) REFERENCES `blockfloor` (`blockFloorId`),
  CONSTRAINT `fk_studenId_roomId` FOREIGN KEY (`roomId`) REFERENCES `room` (`roomId`),
  CONSTRAINT `fk_student_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_student_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_student_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_studentId_blockId` FOREIGN KEY (`blockId`) REFERENCES `block` (`blockId`),
  CONSTRAINT `fk_studentId_courseId` FOREIGN KEY (`courseId`) REFERENCES `course` (`courseId`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (30,76,36,57,'kkkkkkkkkkkkkkk','jjkkjk','2024-10-10',57,'2024-10-21','8876766578','jjd@gmail.com',' jnjj','9995959969','hjkkkkkkkkkkkkkkkk',NULL,NULL,NULL,'2024-10-21 14:31:17',8,'2024-11-29 13:31:48',NULL,NULL,8),(31,77,41,79,'nck','djjdd','2024-10-01',57,'2024-10-21','1288363844','jdj@gmail.com','nnfngf','9849589595','fndfnmf',NULL,NULL,NULL,'2024-10-21 15:19:26',8,'2024-11-29 13:31:48',NULL,NULL,8),(32,77,41,79,'ram','raidkjhd','2024-10-03',99,'2024-10-31','0938998744','ram@gmail.com','cmnvmv','3844894890','dkfklmkv',NULL,NULL,NULL,'2024-10-31 15:29:26',8,'2024-11-29 13:31:48',NULL,NULL,8),(33,85,59,86,'hari','hadj','2024-10-30',82,'2024-11-04','0239094004','hai@gmail.com','hariii','3478747759','c,mc,mcm,',NULL,NULL,NULL,'2024-11-05 07:01:21',8,'2024-11-29 13:31:48',8,NULL,8),(34,89,83,58,'saran sarankumar','dhfdhfhriu84','2001-10-09',108,'2021-10-05','1234590786','sarndjf@gmail.com','saddffgggg','1288770098','rathdjfkdjkfkjfkfkjkjjkjkvjkjkvnnv',NULL,NULL,NULL,'2024-11-22 10:31:53',8,'2024-11-29 13:31:48',NULL,NULL,8),(35,89,83,58,'saran sarankumar','dhfdhfhjjriu84','2001-10-09',108,'2021-10-05','1232590786','sarnd2jf@gmail.com','saddffgggg','1288778098','rathdjfkdjkfkjfkfkjkjjkjkvjkjkvnnv',NULL,NULL,NULL,'2024-11-22 10:33:56',8,'2024-11-24 08:14:44',NULL,NULL,8),(36,89,83,58,'saran sarankumar','dhfdhjjfhjjriu84','2001-10-07',108,'2021-10-03','1232591786','sarnd2ddjf@gmail.com','saddffgggg','1288778111','rathdjfkdjkfkjfkfkjkjjkjkvjkjkvnnv',NULL,NULL,NULL,'2024-11-22 10:41:10',8,'2024-11-28 14:51:21',8,NULL,8),(37,89,83,58,'jeeva','21263uue','2001-02-10',108,'2001-10-29','1232586790','hdjjjc@gmail.com','hckhcdgj','1673765474','dhksjfkgkjbjhf',NULL,NULL,NULL,'2024-11-22 13:28:24',8,'2024-11-29 13:31:48',NULL,NULL,8),(38,89,83,58,'jdjjdjj','uiihuid88','2001-01-09',108,'2013-10-09','8765432108','jjcj@gmail.com','ncknjkdfnk','1223456787','ccdkk',NULL,NULL,NULL,'2024-11-23 11:44:33',8,'2024-11-29 13:31:48',NULL,NULL,8),(39,89,83,58,'hdjhjd','009908','2001-02-09',108,'2001-10-22','2276637367','dhgdh@gmail.com','dhgjd','7676557656','dkkhej',NULL,NULL,NULL,'2024-11-24 06:51:33',8,'2024-11-24 08:14:25',NULL,NULL,8),(40,85,59,86,'hdjhjd','00908','2001-02-09',108,'2001-10-22','2276687367','createjeeva37710@gmail.com','dhgjd','7670557656','dkkhej',NULL,NULL,NULL,'2024-11-24 06:53:01',8,'2024-11-29 06:49:24',NULL,NULL,8),(41,89,83,58,'ramkkkk4kkkkmm','llrMkk','2024-10-27',92,'2024-11-21','1223485579','jjnjff@gmail.com','nkddjj','1234239949','nkewrjwjjmmjjj',NULL,NULL,NULL,'2024-11-25 11:25:44',8,'2024-11-25 11:38:11',8,NULL,NULL),(42,89,83,58,'jjhjnnj','bbbbjnm','2024-10-31',63,'2024-11-25','1234546765','bhjhjbj@gmail.com','jjjdsj','9893837838','hjjjjjnjnjnj',NULL,NULL,NULL,'2024-11-25 14:59:32',8,'2024-11-25 14:59:32',NULL,NULL,NULL),(43,89,83,58,'jeeva jeeva','83748jjj','2024-10-28',101,'2024-11-22','1234545367','jeeva37710@gmail.com','kcmdk','9384948984','kdnkldl',NULL,NULL,NULL,'2024-11-26 18:56:40',8,'2024-11-28 15:47:22',8,NULL,NULL),(44,89,83,58,'jebjdif','83748jjj   1','2024-10-25',100,'2024-11-23','8278748481','jcjc@gmail.com','ncjkds','3878478474','kdkkjdf',NULL,NULL,NULL,'2024-11-27 03:11:12',8,'2024-11-27 16:00:45',8,NULL,NULL),(45,89,83,58,'jnjff90','83748jj8','2024-10-27',59,'2024-11-15','1234586790','kdd@gmail.co','jncjcjrir','8489799559','jhbdj',NULL,NULL,NULL,'2024-11-27 13:21:31',8,'2024-11-28 15:45:55',8,NULL,NULL),(46,89,83,58,'jeevas','kkeje939839-2024-11-27 21:00:02','2024-11-07',58,'2024-11-27','1535636749-2024-11-27 21:00:02','jhjhs@gmail.com-2024-11-27 21:00:02','hjkncncjk','3738737878-2024-11-27 21:00:02','dkjhkff',NULL,NULL,NULL,'2024-11-27 15:16:27',8,'2024-11-29 13:31:48',NULL,NULL,8),(47,89,83,58,'ravikk','83748jjj                                            -2024-11-28 20:13:34','2024-11-09',58,'2024-11-26','8736784871-2024-11-28 20:13:34','jhjhs@gmail.com-2024-11-28 20:13:34','djndjkd','8763786749-2024-11-28 20:13:34','kjdnfg',NULL,NULL,NULL,'2024-11-27 15:32:17',8,'2024-11-29 13:31:48',8,NULL,8),(48,89,83,58,'kkdkdk3','kddkkd-2024-11-28 20:13:21','2024-10-25',100,'2024-11-24','3984989589-2024-11-28 20:13:21','djjdjdj@gmail.com-2024-11-28 20:13:21','jdhddd','8378484848-2024-11-28 20:13:21','dhddk',NULL,NULL,NULL,'2024-11-28 04:53:12',8,'2024-11-29 13:31:48',8,NULL,8),(49,89,83,58,'udfkkffk','kdkfkf','2024-11-06',82,'2024-11-26','1234560987','mmeeejc@gmail.com','mcmmvvm','1324554555','efgkmbkb',NULL,NULL,NULL,'2024-11-28 08:02:44',8,'2024-11-28 17:46:53',8,NULL,NULL);
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warden`
--

DROP TABLE IF EXISTS `warden`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warden` (
  `wardenId` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `emailId` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `createdBy` int DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` int DEFAULT NULL,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `deletedBy` int DEFAULT NULL,
  `superAdmin` tinyint(1) DEFAULT '0',
  `otp` varchar(255) DEFAULT NULL,
  `otpAttempt` int DEFAULT NULL,
  `otpTiming` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`wardenId`),
  UNIQUE KEY `UC_warden_emailId` (`emailId`),
  KEY `fk_warden_createdBy` (`createdBy`),
  KEY `fk_warden_updatedBy` (`updatedBy`),
  KEY `fk_warden_deletedBy` (`deletedBy`),
  CONSTRAINT `fk_warden_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_warden_deletedBy` FOREIGN KEY (`deletedBy`) REFERENCES `warden` (`wardenId`),
  CONSTRAINT `fk_warden_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `warden` (`wardenId`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warden`
--

LOCK TABLES `warden` WRITE;
/*!40000 ALTER TABLE `warden` DISABLE KEYS */;
INSERT INTO `warden` VALUES (6,'jam',NULL,'1998-12-09','jamesjam','jam123','2024-08-10 03:46:42',8,'2024-09-24 15:56:16',6,'2024-08-10 11:54:06',NULL,0,NULL,NULL,NULL),(8,'prem','kumar','2000-12-04','prem123@gmail.com','prem234','2024-08-10 03:49:31',8,'2024-11-29 16:15:53',8,NULL,NULL,1,'CXRvPb',2,NULL),(9,'boopathi',NULL,'2000-10-09','boop','12jjjjjj','2024-08-25 07:52:21',NULL,'2024-11-29 06:24:47',8,'2024-08-25 11:20:25',8,0,NULL,NULL,NULL),(10,'kk',NULL,'2000-10-19','karthick','karthick876','2024-08-25 08:08:35',8,'2024-08-25 11:18:58',8,'2024-08-25 11:18:58',8,0,NULL,NULL,NULL),(11,'james',NULL,'2000-10-11','h','12jjjjjj','2024-08-25 11:21:49',NULL,'2024-11-29 06:24:47',NULL,'2024-08-25 11:22:02',8,0,NULL,NULL,NULL),(12,'umar','j','2000-10-29','llllll','12jjjjjj','2024-08-26 07:31:50',8,'2024-10-25 04:52:04',NULL,'2024-09-26 12:23:27',8,0,NULL,2,NULL),(13,'kkumar',NULL,'2000-10-29','mmmmmm','12jjjjjj','2024-08-26 07:32:40',8,'2024-11-19 11:07:10',NULL,'2024-11-19 11:07:10',8,0,'VusIIg',2,NULL),(14,'kkumar',NULL,'2000-10-29','pkpj','12jjjjjj','2024-08-26 07:33:35',8,'2024-11-19 11:07:23',NULL,'2024-11-19 11:07:23',8,0,'HHgGvT',1,NULL),(15,'kkumar',NULL,'2000-10-29','pkjkj','12jjjjjj','2024-08-26 07:34:52',8,'2024-11-29 06:24:47',NULL,'2024-09-26 12:23:13',8,0,NULL,NULL,NULL),(16,'0',NULL,'2000-10-29','jj','karthick876','2024-08-26 07:40:44',8,'2024-09-14 13:52:13',NULL,'2024-09-14 13:52:13',8,0,NULL,NULL,NULL),(17,'jcnn',NULL,'2024-08-17','k','123','2024-08-27 11:33:11',8,'2024-11-28 06:29:04',NULL,'2024-11-28 06:29:04',8,0,NULL,2,NULL),(18,'jdjdjj',NULL,'2024-08-03','nncmc','12jjjjjj','2024-08-27 11:34:09',8,'2024-11-28 06:30:26',NULL,'2024-11-28 06:30:26',8,0,NULL,2,NULL),(19,'jjx',NULL,'2024-08-03','kd','dnnkdn','2024-08-27 11:36:38',8,'2024-11-28 06:30:34',NULL,'2024-11-28 06:30:34',8,0,'9Qq1YD',NULL,NULL),(20,'n',NULL,'2024-08-02','n n','1111','2024-08-27 11:39:43',8,'2024-11-29 06:24:47',NULL,'2024-11-28 06:30:42',8,0,'UkUJUY',NULL,NULL),(21,'jfnk',NULL,'2024-08-02','cnk','kmckmkcm','2024-08-27 11:43:08',8,'2024-11-28 06:31:11',NULL,'2024-11-28 06:31:11',8,0,'gBSoHF',NULL,NULL),(22,'kdkd',NULL,'2024-08-15','kdd','dnd','2024-08-27 11:44:26',8,'2024-10-24 04:55:27',NULL,NULL,NULL,0,'407600',NULL,NULL),(23,'jhj',NULL,'2024-08-03','kmknk','jk','2024-08-27 11:45:19',8,'2024-10-25 07:02:58',NULL,NULL,NULL,0,'4YVDwm',NULL,NULL),(24,'kj',NULL,'2024-08-10','jh','nnk','2024-08-27 11:47:52',8,'2024-10-25 05:19:28',NULL,NULL,NULL,0,'qih3y2',NULL,NULL),(25,'dkd',NULL,'2024-08-03','kdmk','kdmkd','2024-08-27 11:53:25',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(26,'jdd',NULL,'2024-08-03','jjc','jeeva','2024-08-27 11:56:39',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'HiyckC',2,NULL),(27,'JEEVANANTHAM S',NULL,'2024-08-02','jkjk','999','2024-08-27 12:04:44',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'NfGQMY',NULL,NULL),(28,'king',NULL,'2024-08-10','king','AlwjAyQOM1pKRBK9qrPpAEFxgohBmprj','2024-08-27 12:18:20',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(29,'mmm',NULL,'2024-08-03','kc','11','2024-08-27 12:25:11',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(30,'gh',NULL,'2024-08-02','hjj','123','2024-08-27 12:30:55',8,'2024-10-25 11:55:47',NULL,NULL,NULL,0,NULL,1,NULL),(31,'k',NULL,'2024-08-02','mcm','mmc','2024-08-27 17:02:10',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'woeXp4',2,NULL),(32,'jfkv',NULL,'2000-08-08','nn','11','2024-08-27 17:06:13',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(33,'dm',NULL,'2008-01-08','nccmc','prem','2024-08-27 17:23:12',8,'2024-08-27 17:23:12',NULL,NULL,NULL,0,NULL,NULL,NULL),(34,'cmmm','cm','2023-01-01','mm@gmail.com','12343998696769','2024-08-27 17:47:27',8,'2024-11-29 06:24:47',8,NULL,NULL,0,'1EXFDc',NULL,NULL),(35,'kmkd',NULL,'2024-08-03','kkd','12jjjjjj','2024-08-27 20:32:07',8,'2024-10-24 17:47:12',NULL,NULL,NULL,0,NULL,1,NULL),(36,'99',NULL,'2024-08-03','dkd','11','2024-08-27 20:32:37',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(37,'nccmkm,',NULL,'2024-08-03','999','jeeva','2024-08-27 20:38:11',8,'2024-10-25 09:50:37',NULL,NULL,NULL,0,'vuwwoE',NULL,NULL),(38,'994',NULL,'2024-08-10','jnmc','jeeva','2024-08-27 20:40:22',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'CqdS65',NULL,NULL),(39,'jeeva',NULL,'2024-08-10','jeeva','123456','2024-08-28 04:21:26',8,'2024-10-27 15:47:32',NULL,NULL,NULL,0,'fbrqnx',2,NULL),(40,'999',NULL,'2010-06-17','333','mk','2024-08-28 04:22:51',8,'2024-10-25 05:50:53',NULL,NULL,NULL,0,'3FQGjZ',NULL,NULL),(41,'1',NULL,'2024-08-02','jd','ii','2024-08-28 04:40:57',8,'2024-09-14 13:52:22',NULL,'2024-09-14 13:52:22',8,0,NULL,NULL,NULL),(42,'JEEVANANTHAM S','hhhi','2024-08-03','jeeva37710@gmail.com','123456','2024-08-28 06:15:15',8,'2024-11-29 16:04:41',NULL,NULL,NULL,0,'8UTZ5X',NULL,'2024-11-29 11:17:54'),(44,'jdjd',NULL,'2024-08-03','mnmd','11','2024-08-28 07:09:07',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(47,'jdjdj',NULL,'2024-08-10','kdddd','dd','2024-08-28 07:24:53',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(48,'jj',NULL,'2024-08-02','jjj','cyrV3qnLEXPiGnoBdNqqWiJTVYmV21tJ','2024-08-28 07:33:16',8,'2024-10-27 07:04:29',NULL,NULL,NULL,0,'3UB0mu',NULL,NULL),(49,'kkknf',NULL,'2024-08-03','vbdnm,','jee9v0a','2024-08-28 07:34:25',8,'2024-10-25 19:19:11',NULL,NULL,NULL,0,'C19NUy',2,NULL),(50,'cjnncn',NULL,'2024-08-10','9','pp','2024-08-28 07:34:44',8,'2024-08-28 07:34:44',NULL,NULL,NULL,0,NULL,NULL,NULL),(52,'dmm',NULL,'2024-08-03','king@gamil.com','jee9v0a','2024-08-28 08:14:32',8,'2024-10-25 17:15:14',NULL,NULL,NULL,0,'AzDqtn',NULL,NULL),(53,'sarans','lllkks','2024-08-01','ihj@gmail.com','123456','2024-08-28 10:44:57',8,'2024-09-27 14:29:43',8,'2024-09-27 14:29:43',8,0,NULL,NULL,NULL),(54,'jjd','dkdk','2024-08-03','jdhjhd@gmail.com','123r','2024-08-28 10:51:35',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'rhHL1x',NULL,NULL),(55,'ckcc',NULL,'2024-08-11','jjdjnjd@gmail.com','654321','2024-08-28 13:00:39',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(56,'fbnbnm','jkf','2024-08-10','@gmail.com','123456','2024-08-29 15:19:33',8,'2024-10-25 16:47:33',NULL,NULL,NULL,0,'bvg1Xh',NULL,NULL),(57,'JEEVANANTHAM S','kkk','2024-08-04','ghjk@gmail.com','jeev0a','2024-08-29 15:22:27',8,'2024-10-26 05:00:57',NULL,NULL,NULL,0,'f48IXX',NULL,NULL),(58,'james',NULL,'2024-07-11','hari@gmail.com','123456','2024-09-01 11:10:01',8,'2024-09-01 11:10:01',NULL,NULL,NULL,0,NULL,NULL,NULL),(59,'ghj',NULL,'2024-07-17','kingghj@fgvbnj.gmail.com','123456','2024-09-01 11:12:37',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(60,'hjk',NULL,'2024-03-07','jeeva@gmail.com','0rsSDwjdzhZCjHEgC8rEUyoBAKUd5Vut','2024-09-01 11:18:35',8,'2024-10-22 17:25:04',NULL,NULL,NULL,0,NULL,NULL,NULL),(61,'hjk','d','2024-03-06','jeeva00@gmail.com','jeev0a','2024-09-01 11:19:37',8,'2024-11-29 06:24:47',8,NULL,NULL,0,'V5vV9x',NULL,NULL),(62,'aaaaa','fff','2021-05-11','vbnb@gmail.com','jeeva','2024-09-15 05:08:26',55,'2024-10-25 13:56:04',NULL,NULL,NULL,0,NULL,2,NULL),(63,'jjjjjjj',NULL,'2020-05-28','222222222@gmail.com','123456','2024-09-21 07:22:53',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'paYTvM',NULL,NULL),(64,'ram23','fjfjf23','2024-03-03','jjjj23@gmail.com','11','2024-09-21 08:07:03',8,'2024-10-25 12:11:52',8,NULL,NULL,0,'LFfCfq',NULL,NULL),(65,'kaaaaa','kkkkkkkkkk','2024-08-31','ooo@gmail.com','123456','2024-09-21 08:08:31',8,'2024-11-29 06:24:47',8,NULL,NULL,0,'dYI96b',NULL,NULL),(66,'akash','jkkk','2024-01-29','haaaaada23@gmail.com','1122','2024-09-21 09:44:47',8,'2024-11-29 06:24:47',8,NULL,NULL,1,'emEapw',NULL,NULL),(67,'ganesh112','rajjj','2024-02-11','kkkkk@gmail.com','12jjjjjj','2024-09-27 14:24:14',8,'2024-11-29 06:24:47',8,NULL,NULL,1,'Me2696',NULL,NULL),(68,'wwww','www','2024-02-29','createjeeva37710@gmail.com','123456789','2024-10-22 17:07:46',NULL,'2024-11-29 06:24:47',NULL,'2024-11-19 11:06:58',8,0,'JlVp4W',NULL,NULL),(69,'leo','sdfg','2024-10-04','leoraj04065@gmail.com','12jjjjjj','2024-10-23 09:38:42',8,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'822950',1,NULL),(70,'rammmmmmmmmmmm','kkkkkkk','2024-10-01','rammmm@gmail.com','123','2024-10-25 16:00:42',8,'2024-10-26 04:54:52',NULL,NULL,NULL,1,NULL,NULL,NULL),(71,'rammmmmmmmmmmm','kkkkkkk','2024-10-01','rammmm33@gmail.com','123456','2024-10-25 16:01:48',8,'2024-10-25 16:40:13',NULL,NULL,NULL,1,'T1T3Bo',NULL,NULL),(72,'hhh','jjjj','2001-10-22','jeeva08@gmail.com','1233','2024-10-25 16:50:51',NULL,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(74,'kjk','kk','1000-10-01','kk@gmail.com','11','2024-10-25 17:28:22',NULL,'2024-11-29 06:24:47',NULL,NULL,NULL,0,NULL,NULL,NULL),(75,'udhaya','kumar','2024-10-03','udhayakumar1222@gmail.com','123456','2024-10-26 03:37:12',8,'2024-10-26 03:37:12',NULL,NULL,NULL,1,NULL,NULL,NULL),(76,'udhaya','kumar','2024-10-03','udhayakumar1222ns@gmail.com','123456','2024-10-26 03:40:04',8,'2024-10-26 03:41:56',NULL,NULL,NULL,1,'39nLIW',1,NULL),(77,'jeeva2','s','2001-10-09','jeevaOffl377@gmail.com','123456','2024-10-28 16:11:42',NULL,'2024-11-29 06:24:47',NULL,NULL,NULL,0,'DLY16P',NULL,NULL),(78,'udh','kkk','2024-10-19','ffg@gmail.com','123456','2024-10-31 17:59:45',8,'2024-10-31 17:59:45',NULL,NULL,NULL,1,NULL,NULL,NULL),(79,'udh','kkk','2024-10-19','ffghgh@gmail.com','123456','2024-10-31 18:01:28',8,'2024-10-31 18:01:28',NULL,NULL,NULL,1,NULL,NULL,NULL),(80,'udh','kkk','2024-10-19','ffghghjhgfchjjg@gmail.com','123456','2024-10-31 18:02:46',8,'2024-10-31 18:02:46',NULL,NULL,NULL,1,NULL,NULL,NULL),(81,'hhjckvdkf','dmn f','2024-10-08','mnvndf11@gmail.com','123456','2024-10-31 18:04:05',8,'2024-10-31 18:04:05',NULL,NULL,NULL,1,NULL,NULL,NULL),(82,'n,vm',',md','2024-10-08','fndmgnmhm@gmail.com','123456','2024-10-31 18:05:52',8,'2024-11-01 05:45:44',8,NULL,NULL,1,NULL,NULL,NULL),(83,NULL,NULL,NULL,NULL,NULL,'2024-11-16 15:54:58',NULL,'2024-11-16 15:54:58',NULL,NULL,NULL,0,NULL,NULL,NULL),(84,'ganesh','ram','2001-04-10','ganesh33@gmail.com','ganesh123','2024-11-18 07:02:23',8,'2024-11-18 07:02:23',NULL,NULL,NULL,1,NULL,NULL,NULL),(85,'yuven','ram','2001-04-10','ganesh331@gmail.com','ganesh123','2024-11-18 07:04:40',8,'2024-11-18 07:04:40',NULL,NULL,NULL,1,NULL,NULL,NULL),(86,'sivaguru2','sivaguru','2024-05-04','gurujjjjj@gmail.com','1234567a','2024-11-18 10:52:31',8,'2024-11-18 10:52:31',NULL,NULL,NULL,1,NULL,NULL,NULL),(87,'jamesram','ramjames','2024-11-06','ramsiva22@gmail.com','123456','2024-11-18 10:58:29',8,'2024-11-18 10:58:29',NULL,NULL,NULL,1,NULL,NULL,NULL),(88,'premganesh','ganesh','2024-07-05','jjjd@gmail.com','1234567','2024-11-18 11:02:57',8,'2024-11-18 11:02:57',NULL,NULL,NULL,1,NULL,NULL,NULL),(89,'kkk22','kkkkkkkkkkkkkkkkkkkkkk','2024-10-31','jjfjf@gmail.com','123456','2024-11-18 11:39:52',8,'2024-11-18 11:39:52',NULL,NULL,NULL,1,NULL,NULL,NULL),(90,'jamesssss','jam','2024-10-31','jjfffj@gmail.com','1234567','2024-11-18 14:06:28',8,'2024-11-18 14:06:28',NULL,NULL,NULL,1,NULL,NULL,NULL),(91,'lllllll','lll','2024-11-02','xckcn@gmail.com','0987654','2024-11-18 14:39:07',8,'2024-11-18 14:39:07',NULL,NULL,NULL,0,NULL,NULL,NULL),(92,'sureh kumar90','kumar','2024-11-15','jddjdd@gmail.com','1234567','2024-11-19 06:15:02',8,'2024-11-19 06:15:02',NULL,NULL,NULL,1,NULL,NULL,NULL),(93,'essjjjjjjjjjjjjjjjjjj','kkkkkkkkkkkkkkkkkkkkkkkk','2024-11-16','cklkkf@gmail.com','1234567','2024-11-19 07:56:58',8,'2024-11-19 07:56:58',NULL,NULL,NULL,1,NULL,NULL,NULL),(94,'donsiiiiiiii','ram5','2001-04-10','iiiiiiiiiiiii@gmail.com','ganesh123','2024-11-19 10:12:34',8,'2024-11-19 10:12:34',NULL,NULL,NULL,1,NULL,NULL,NULL),(95,'dddiiiiiicjcj','ram5','2001-04-10','hdhdddd@gmail.com','ganesh123','2024-11-19 10:14:32',8,'2024-11-19 10:14:32',NULL,NULL,NULL,1,NULL,NULL,NULL),(96,'dddiiiiiicjcj','ram5','2001-04-10','hhhhh@gmail.com','ganesh123','2024-11-19 10:33:00',8,'2024-11-19 10:33:00',NULL,NULL,NULL,1,NULL,NULL,NULL),(97,'dddiiiiiicjcj','ram5','2001-04-10','hhhh8h@gmail.com','ganesh123','2024-11-19 10:45:18',8,'2024-11-19 10:45:18',NULL,NULL,NULL,1,NULL,NULL,NULL),(98,'iiiicjcj','ram5','2001-04-10','hhhh8jjfh@gmail.com','ganesh123','2024-11-19 10:49:46',8,'2024-11-19 10:49:46',NULL,NULL,NULL,1,NULL,NULL,NULL),(99,'iiiicjcj444','ram5','2001-04-10','dkfjkbbjjjfh@gmail.com','ganesh123','2024-11-19 14:57:40',8,'2024-11-19 14:57:40',NULL,NULL,NULL,1,NULL,NULL,NULL),(100,'iiiicjcj444','ram5','2001-04-10','dkfjkbbjjjf77h@gmail.com','ganesh123','2024-11-19 14:59:04',8,'2024-11-19 14:59:04',NULL,NULL,NULL,1,NULL,NULL,NULL),(101,'iiiicjcj444','ram5','2001-04-10','dkfjkbbjjjf77h88@gmail.com','ganesh123','2024-11-19 15:04:41',8,'2024-11-19 15:04:41',NULL,NULL,NULL,1,NULL,NULL,NULL),(102,'iiiicjcj444','ram5','2001-04-10','dkfjkbbjjjf77hjjh88@gmail.com','ganesh123','2024-11-19 15:06:13',8,'2024-11-19 15:06:13',NULL,NULL,NULL,1,NULL,NULL,NULL),(103,'iiiicjcj444','ram5','2001-04-10','dk77hjjh88@gmail.com','ganesh123','2024-11-19 15:07:23',8,'2024-11-19 15:07:23',NULL,NULL,NULL,1,NULL,NULL,NULL),(104,'iiiicjcj444','ram5','2001-04-10','dk77hjjh888@gmail.com','ganesh123','2024-11-19 15:15:45',8,'2024-11-19 15:15:45',NULL,NULL,NULL,1,NULL,NULL,NULL),(105,'iiiicjcj444','ram5','2001-04-10','ojjjjjjjjjjjjjj@gmail.com','ganesh123','2024-11-19 15:17:20',8,'2024-11-19 15:17:20',NULL,NULL,NULL,1,NULL,NULL,NULL),(106,'dons','ram5','2001-04-10','doneeee@gmail.com','ganesh123','2024-11-20 03:34:01',8,'2024-11-20 03:34:01',NULL,NULL,NULL,1,NULL,NULL,NULL),(107,'dons','ram5','2001-04-10','don155@gmail.com','ganesh123','2024-11-20 14:05:38',8,'2024-11-20 14:05:38',NULL,NULL,NULL,1,NULL,NULL,NULL),(108,'dons','ram5','2001-04-10','don1595@gmail.com','ganesh123','2024-11-20 14:08:33',8,'2024-11-20 14:08:33',NULL,NULL,NULL,1,NULL,NULL,NULL),(109,'dons','ram5','2001-04-10','don881595@gmail.com','ganesh123','2024-11-20 14:10:17',8,'2024-11-20 14:10:17',NULL,NULL,NULL,1,NULL,NULL,NULL),(110,'dons','ram5','2001-04-10','don88w1595@gmail.com','ganesh123','2024-11-20 14:11:48',8,'2024-11-20 14:11:48',NULL,NULL,NULL,1,NULL,NULL,NULL),(111,'dons','ram5','2001-04-10','don88w1599995@gmail.com','ganesh123','2024-11-20 14:13:04',8,'2024-11-20 14:13:04',NULL,NULL,NULL,1,NULL,NULL,NULL),(112,'dons','ram5','2001-04-10','don88kkw1599995@gmail.com','ganesh123','2024-11-20 14:15:00',8,'2024-11-20 14:15:00',NULL,NULL,NULL,1,NULL,NULL,NULL),(113,'dons','ram5','2001-04-10','don88kikw1599995@gmail.com','ganesh123','2024-11-20 14:18:00',8,'2024-11-20 14:18:00',NULL,NULL,NULL,1,NULL,NULL,NULL),(114,'dons','ram5','2001-04-10','donw88kikw1599995@gmail.com','ganesh123','2024-11-20 14:21:15',8,'2024-11-23 12:09:55',NULL,'2024-11-23 12:09:55',8,1,NULL,NULL,NULL),(115,'dons','ram5','2001-04-10','don77w88kikw1599995@gmail.com','ganesh123','2024-11-20 14:22:29',8,'2024-11-20 14:22:29',NULL,NULL,NULL,1,NULL,NULL,NULL),(116,'dons','ram5','2001-04-10','don77w88jbbjhhkikw1599995@gmail.com','ganesh123','2024-11-20 14:29:58',8,'2024-11-20 15:43:59',NULL,NULL,NULL,1,NULL,NULL,NULL),(117,'dons','ram5','2001-04-10','don77w88jb33bjhhkikw1599995@gmail.com','ganesh123','2024-11-20 14:37:10',8,'2024-11-20 15:54:18',NULL,NULL,NULL,1,NULL,NULL,NULL),(118,'dons','ram5','2001-04-10','hhhhiii@gmail.com','123456','2024-11-20 14:49:47',8,'2024-11-20 16:45:14',NULL,NULL,NULL,1,NULL,NULL,NULL),(119,'dons','ram5','2001-04-10','hh5hhiii@gmail.com','123456','2024-11-20 14:51:52',8,'2024-11-20 17:08:50',NULL,NULL,NULL,1,NULL,NULL,NULL),(120,'jjjkkjkj','mnnmn','2024-11-14','mmm@gmail.com','123456','2024-11-20 16:53:32',118,'2024-11-20 16:59:54',NULL,NULL,NULL,1,NULL,NULL,NULL),(121,'jkkj','kjjk','2024-11-01','bjkjkk@gmail.com','1234567','2024-11-20 17:35:51',119,'2024-11-20 17:35:51',NULL,NULL,NULL,1,NULL,NULL,NULL),(122,'bbbf','ndn','2024-11-06','bb22@gmail.com','123456','2024-11-20 17:38:03',119,'2024-11-20 17:38:03',NULL,NULL,NULL,1,NULL,NULL,NULL),(123,'dons','ram5','2001-04-10','jdjjfdj@gmail.com','123456','2024-11-21 09:48:31',8,'2024-11-21 09:48:31',NULL,NULL,NULL,1,NULL,NULL,NULL),(124,'hhhh99009887','hhhh','2024-11-05','jhjbsj@gmail.com','123456','2024-11-21 14:28:53',8,'2024-11-21 14:28:53',NULL,NULL,NULL,1,NULL,NULL,NULL),(125,'dons','ram5','2001-04-10','jdjjfhdj@gmail.com','123456','2024-11-21 14:35:27',8,'2024-11-21 14:35:27',NULL,NULL,NULL,1,NULL,NULL,NULL),(126,'dons','ram5','2001-04-10','jdjj77777fhdj@gmail.com','123456','2024-11-21 15:11:21',8,'2024-11-21 15:11:21',NULL,NULL,NULL,1,NULL,NULL,NULL),(127,'dons','ram5','2001-04-10','jdjj777hhh77fhdj@gmail.com','123456','2024-11-21 15:14:20',8,'2024-11-21 15:14:20',NULL,NULL,NULL,1,NULL,NULL,NULL),(128,'dons','ram5','2001-04-10','jdjj777h77hh77fhdj@gmail.com','123456','2024-11-21 15:16:10',8,'2024-11-21 15:16:10',NULL,NULL,NULL,1,NULL,NULL,NULL),(129,'dons','ram5','2001-04-10','jdjj777h7jj7hh77fhdj@gmail.com','123456','2024-11-21 15:16:40',8,'2024-11-28 06:28:48',NULL,'2024-11-28 06:28:48',8,1,NULL,NULL,NULL),(130,'kskksks','ksksks','2024-11-08','jfndjj@gmail.com','123456','2024-11-22 05:24:10',8,'2024-11-22 05:24:10',NULL,NULL,NULL,1,NULL,NULL,NULL),(131,'dons','ram5','2001-04-10','jdjj777h7jjjhbjk7hh77fhdj@gmail.com','123456','2024-11-22 06:12:12',8,'2024-11-28 06:12:16',NULL,'2024-11-28 06:12:16',8,1,NULL,NULL,NULL),(132,'cnkdnfkj','mcdknfk','2024-11-09','qwertf@gmail.com','123456','2024-11-22 07:59:25',130,'2024-11-28 06:32:14',NULL,'2024-11-28 06:32:14',8,1,NULL,NULL,NULL),(133,'dons','ram5','2001-04-10','jdjj777h7jjjjjjjjhbjk7hh77fhdj@gmail.com','123456','2024-11-22 10:38:19',8,'2024-11-28 06:11:39',NULL,'2024-11-28 06:11:39',8,1,NULL,NULL,NULL),(134,'dons','ram5','2001-04-10','jdjj777h77jjjjjjjjhbjk7hh77fhdj@gmail.com','123456','2024-11-22 10:39:16',8,'2024-11-28 06:11:32',NULL,'2024-11-28 06:11:32',8,1,NULL,NULL,NULL),(135,'dnndkdkjkjkdjkdjkf','jfbfjkf','2024-11-07','jjdjhdhdg@gmail.com','123456','2024-11-22 13:08:52',8,'2024-11-28 06:32:07',NULL,'2024-11-28 06:32:07',8,1,NULL,NULL,NULL),(136,'dons77777','ram5','2001-04-10','7hh7hhh7fhdj@gmail.com','1234568','2024-11-22 15:28:45',8,'2024-11-28 06:28:38',NULL,'2024-11-28 06:28:38',8,1,NULL,NULL,NULL),(137,'dons77777','ram5','2001-04-10','7hh78hhh7fhdj@gmail.com','1234568','2024-11-22 15:38:32',8,'2024-11-28 06:28:29',NULL,'2024-11-28 06:28:29',8,1,NULL,NULL,NULL),(138,'dons77777','ram5','2001-04-10','7hh78hhhhhh7ggggfhdj@gmail.com','1234568','2024-11-22 16:07:09',8,'2024-11-28 06:28:18',NULL,'2024-11-28 06:28:18',8,1,NULL,NULL,NULL),(139,'dons77777','ram5','2001-04-10','7hh78hhhhjjjhh7ggggfhdj@gmail.com','1234568','2024-11-22 16:08:23',8,'2024-11-28 06:12:34',NULL,'2024-11-28 06:12:34',8,1,NULL,NULL,NULL),(140,'dons77777','ram5','2001-04-10','7hh78hh9hhjjjhh7ggggfhdj@gmail.com','1234568','2024-11-22 16:14:16',8,'2024-11-28 06:12:22',NULL,'2024-11-28 06:12:22',8,1,NULL,NULL,NULL),(141,'dons','ram5','2001-04-10','jdjj777hkk77jjjjjjjjhbjk7hh77fhdj@gmail.com','123456','2024-11-23 05:24:40',8,'2024-11-28 06:11:22',NULL,'2024-11-28 06:11:22',8,1,NULL,NULL,NULL),(142,'dons','ram5','2001-04-10','jdjj77j7hkk77jjjjjjjjhbjk7hh77fhdj@gmail.com','123456','2024-11-23 05:25:35',8,'2024-11-28 06:11:16',NULL,'2024-11-28 06:11:16',8,1,NULL,NULL,NULL),(143,'dons','ram5','2001-04-10','jdjj77jkk7khkkjkjdjd77oojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 06:52:57',8,'2024-11-24 06:16:09',NULL,'2024-11-24 06:16:09',8,1,NULL,NULL,NULL),(144,'dons','ram5','2001-04-10','jdjj77jkkjjj7khkkjkjdjd77oojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 06:59:52',8,'2024-11-23 12:10:12',NULL,'2024-11-23 12:10:12',8,1,NULL,NULL,NULL),(145,'dons','ram5','2001-04-10','jdjj77jkkjjj7khkkjkjdjd7jj7oojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 07:05:15',8,'2024-11-23 12:08:55',NULL,'2024-11-23 12:08:55',8,1,NULL,NULL,NULL),(146,'dons','ram5','2001-04-10','jdjj77jkkjjjjj7khkkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 07:57:05',8,'2024-11-28 06:10:31',NULL,'2024-11-28 06:10:31',8,1,NULL,NULL,NULL),(147,'dons','ram5','2001-04-10','jdjj77jkkjjjjjffnf7khkkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 09:46:51',8,'2024-11-23 11:07:11',NULL,'2024-11-23 11:07:11',8,1,NULL,NULL,NULL),(148,'dons','ram5','2001-04-10','jdjj77jkkjjjjjffnf7khkddkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 09:47:50',8,'2024-11-28 06:10:57',NULL,'2024-11-28 06:10:57',8,1,NULL,NULL,NULL),(149,'dons','ram5','2001-04-10','jdjj77jkkjjjjjffnf7klhkddkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 09:52:07',8,'2024-11-28 06:10:51',NULL,'2024-11-28 06:10:51',8,1,NULL,NULL,NULL),(150,'dons','ram5','2001-04-10','jdjj77jkkjjjjjff7nf7klhkddkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 09:58:36',8,'2024-11-23 11:06:54',NULL,'2024-11-23 11:06:54',8,1,NULL,NULL,NULL),(151,'dons','ram5','2001-04-10','jdjj7777jkkjjjjjff7nf7klhkddkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 10:26:19',8,'2024-11-23 11:06:36',NULL,'2024-11-23 11:06:36',8,1,NULL,NULL,NULL),(152,'dons','ram5','2001-04-10','jdjj7777jkkjjjddjjjff7nf7klhkddkjkjdjd7jj7jjoojjjjjjjjhbjjjjhhk7hh77fhdj@gmail.com','123456','2024-11-23 15:26:34',8,'2024-11-28 06:10:24',NULL,'2024-11-28 06:10:24',8,1,NULL,NULL,NULL),(153,'dons','ram5','2001-04-10','prem@gmail.com','123456','2024-11-24 06:06:39',8,'2024-11-24 06:15:51',NULL,'2024-11-24 06:15:51',8,1,NULL,NULL,NULL),(154,'dons','ram5','2001-04-10','hddhghf@gmail.com','123456','2024-11-25 14:45:38',8,'2024-11-28 06:32:02',NULL,'2024-11-28 06:32:02',8,1,NULL,NULL,NULL),(155,'dons','ram5','2001-04-09','dfbg@gmail.com','123456','2024-11-28 06:03:41',8,'2024-11-28 06:31:28',NULL,'2024-11-28 06:31:28',8,1,NULL,NULL,NULL),(156,'kdkdk','kfkfk','2024-11-07','jdjdjj33@gmail.com','1234567','2024-11-28 07:32:04',8,'2024-11-28 07:32:04',NULL,NULL,NULL,1,NULL,NULL,NULL),(157,'jnjnj','ffkkff','2024-11-07','kdkd@gmail.com','123456','2024-11-28 07:37:02',8,'2024-11-28 07:37:02',NULL,NULL,NULL,1,NULL,NULL,NULL),(158,'ramjjjf','jfjfj','2024-11-14','ramkk@gmail.com','123456','2024-11-28 07:41:02',8,'2024-11-28 07:41:02',NULL,NULL,NULL,1,NULL,NULL,NULL),(159,'jdjkjdj','jfjf','2024-11-09','dfkjdk@gmail.com','123456','2024-11-28 07:53:14',8,'2024-11-28 07:53:14',NULL,NULL,NULL,1,NULL,NULL,NULL),(160,'jamess','jamesf','2024-11-11','djjf@gmail.com','123456','2024-11-28 07:56:55',8,'2024-11-28 07:56:55',NULL,NULL,NULL,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `warden` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-02 11:11:22
