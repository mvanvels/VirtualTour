-- phpMyAdmin SQL Dump
-- version 4.8.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 19, 2018 at 04:10 AM
-- Server version: 5.7.21
-- PHP Version: 7.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `virtualtour`
--
CREATE DATABASE IF NOT EXISTS `virtualtour` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `virtualtour`;

-- --------------------------------------------------------

--
-- Table structure for table `map`
--

DROP TABLE IF EXISTS `map`;
CREATE TABLE `map` (
  `USER_ID` int(11) NOT NULL,
  `MAP_ID` int(11) NOT NULL,
  `MAP_NAME` varchar(100) NOT NULL,
  `MAP_DESC` varchar(255) DEFAULT NULL,
  `MAP_IMAGE` varchar(255) DEFAULT NULL,
  `MAP_ISPUBLISHED` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `map`
--

TRUNCATE TABLE `map`;
--
-- Dumping data for table `map`
--

INSERT INTO `map` (`USER_ID`, `MAP_ID`, `MAP_NAME`, `MAP_DESC`, `MAP_IMAGE`, `MAP_ISPUBLISHED`) VALUES
(1, 1, 'OVERVIEW', 'EAGLE EYE VIEW OF OTTUMWA CAMPUS', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `poi`
--

DROP TABLE IF EXISTS `poi`;
CREATE TABLE `poi` (
  `POI_ID` int(11) NOT NULL,
  `MAP_ID` int(11) NOT NULL,
  `POI_NAME` varchar(50) NOT NULL,
  `POI_COORDS` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `poi`
--

TRUNCATE TABLE `poi`;
--
-- Dumping data for table `poi`
--

INSERT INTO `poi` (`POI_ID`, `MAP_ID`, `POI_NAME`, `POI_COORDS`) VALUES
(1, 1, 'ARTS & SCIENCES WING', '109 194, 117 232, 189 217, 190 222, 217 219, 209 164, 128 180, 109 193, 109 194'),
(2, 1, 'KEOKUK/MAHASKA RESIDENCE HALL', '222 187, 237 201, 287 158, 273 150, 225 186, 222 187'),
(3, 1, 'DINING ROOM/LIBRARY', '238 199, 222 217, 239 236, 265 215, 240 200, 238 199'),
(4, 1, 'APPANOOSE RESIDENCE HALL', '308 231, 292 249, 332 282, 345 266, 310 231, 308 231'),
(5, 1, 'ADMINISTRATIVE WING', '285 263, 273 278, 305 307, 322 298, 285 265, 285 263'),
(6, 1, 'WAPELLO RESIDENCE HALL', '320 293, 309 309, 354 344, 375 323, 376 315, 365 306, 351 319, 323 294, 320 293'),
(7, 1, 'TRUSTEE RESIDENCE HALL', '335 130, 335 151, 348 153, 351 165, 366 166, 364 151, 397 151, 396 132, 384 128, 380 114, 349 114, 340 128, 335 130'),
(8, 1, 'HELLYER STUDENT LIFE CENTER', '406 242, 414 259, 414 280, 425 285, 470 281, 480 268, 473 248, 474 227, 460 229, 457 216, 413 229, 407 240, 406 242'),
(9, 1, 'MARGE DODD OUTDOOR STAGE', '485 300, 467 322, 484 336, 509 313, 486 298, 485 300'),
(10, 1, 'CHILD DEVELOPMENT CENTER', '482 18, 479 25, 485 33, 464 56, 465 64, 483 75, 514 33, 490 17, 477 20, 482 18'),
(11, 1, 'CEMETERY', '534 18, 536 57, 566 58, 563 21, 535 21, 534 18'),
(12, 1, 'MAINTENANCE BUILDING', '601 39, 600 58, 629 60, 650 50, 653 19, 625 22, 623 36, 603 38, 601 39'),
(13, 1, 'BENNETT STUDENT SERVICES CENTER', '546 79, 512 110, 517 119, 529 130, 563 131, 577 114, 580 106, 546 83, 546 79'),
(14, 1, 'OAK RESIDENCE HALL', '664 114, 663 154, 634 161, 635 176, 679 183, 711 177, 725 125, 712 119, 695 159, 686 155, 680 158, 680 119, 665 113, 664 114'),
(15, 1, 'ADVANCED TECHNOLOGY CENTER', '614 203, 612 260, 628 270, 658 295, 672 278, 685 282, 710 285, 731 289, 749 268, 740 252, 718 238, 683 206, 665 197, 619 204, 614 203'),
(16, 1, 'TOM ARNOLD NET CENTER', '600 355, 575 377, 576 387, 623 426, 646 406, 647 393, 602 356, 600 355'),
(17, 1, 'R.L. HELLYER SOFTBALL FIELD', '663 390, 724 392, 729 444, 702 448, 675 440, 666 426, 663 415, 663 393, 663 390'),
(18, 1, 'ROSENMAN VIDEO CONFERENCE TRAINING CENTER', '853 217, 837 238, 838 251, 864 267, 872 275, 881 290, 895 292, 911 286, 915 267, 909 250, 899 239, 855 218, 853 217'),
(19, 1, 'RURAL HEALTH EDUCATION CENTER', '846 298, 827 305, 823 319, 829 332, 845 334, 860 327, 884 311, 873 289, 843 299, 846 298'),
(20, 1, 'SECURITY OFFICE', '722 359, 721 384, 747 383, 745 358, 724 358, 722 359'),
(21, 1, 'SOCCER FIELD', '744 398, 748 443, 843 439, 838 391, 746 397, 744 398');

-- --------------------------------------------------------

--
-- Table structure for table `poi_connection`
--

DROP TABLE IF EXISTS `poi_connection`;
CREATE TABLE `poi_connection` (
  `POI_CONN_ID` int(11) NOT NULL,
  `MAP_ID` int(11) NOT NULL,
  `POI_CONN_FROM` int(11) NOT NULL,
  `POI_CONN_TO` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `poi_connection`
--

TRUNCATE TABLE `poi_connection`;
-- --------------------------------------------------------

--
-- Table structure for table `poi_connection_video`
--

DROP TABLE IF EXISTS `poi_connection_video`;
CREATE TABLE `poi_connection_video` (
  `MAP_ID` int(11) NOT NULL,
  `POI_CONN_ID` int(11) NOT NULL,
  `POI_CONN_FROM` int(11) NOT NULL,
  `POI_CONN_TO` int(11) NOT NULL,
  `POI_CONN_VIDEO` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `poi_connection_video`
--

TRUNCATE TABLE `poi_connection_video`;
-- --------------------------------------------------------

--
-- Table structure for table `poi_image`
--

DROP TABLE IF EXISTS `poi_image`;
CREATE TABLE `poi_image` (
  `POI_ID` int(11) NOT NULL,
  `POI_IMAGE` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `poi_image`
--

TRUNCATE TABLE `poi_image`;
-- --------------------------------------------------------

--
-- Table structure for table `poi_video`
--

DROP TABLE IF EXISTS `poi_video`;
CREATE TABLE `poi_video` (
  `POI_ID` int(11) NOT NULL,
  `POI_VIDEO` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `poi_video`
--

TRUNCATE TABLE `poi_video`;
-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `USER_ID` int(11) NOT NULL,
  `USER_USERNAME` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Truncate table before insert `user`
--

TRUNCATE TABLE `user`;
--
-- Dumping data for table `user`
--

INSERT INTO `user` (`USER_ID`, `USER_USERNAME`) VALUES
(1, 'ihcc_ottumwa'),
(3, 'ihcc_remote');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `map`
--
ALTER TABLE `map`
  ADD UNIQUE KEY `MAP_ID` (`MAP_ID`),
  ADD KEY `USER_ID` (`USER_ID`);

--
-- Indexes for table `poi`
--
ALTER TABLE `poi`
  ADD PRIMARY KEY (`POI_ID`),
  ADD KEY `MAP_ID` (`MAP_ID`);

--
-- Indexes for table `poi_connection`
--
ALTER TABLE `poi_connection`
  ADD PRIMARY KEY (`POI_CONN_ID`),
  ADD KEY `POI_CONN_TO` (`POI_CONN_TO`),
  ADD KEY `POI_CONN_FROM` (`POI_CONN_FROM`),
  ADD KEY `MAP_ID` (`MAP_ID`);

--
-- Indexes for table `poi_connection_video`
--
ALTER TABLE `poi_connection_video`
  ADD KEY `MAP_ID` (`MAP_ID`),
  ADD KEY `POI_CONN_ID` (`POI_CONN_ID`);

--
-- Indexes for table `poi_image`
--
ALTER TABLE `poi_image`
  ADD KEY `POI_ID_2` (`POI_ID`);

--
-- Indexes for table `poi_video`
--
ALTER TABLE `poi_video`
  ADD UNIQUE KEY `POI_ID_2` (`POI_ID`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`USER_ID`),
  ADD UNIQUE KEY `USER_USERNAME` (`USER_USERNAME`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `map`
--
ALTER TABLE `map`
  MODIFY `MAP_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `poi`
--
ALTER TABLE `poi`
  MODIFY `POI_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `poi_connection`
--
ALTER TABLE `poi_connection`
  MODIFY `POI_CONN_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `USER_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `map`
--
ALTER TABLE `map`
  ADD CONSTRAINT `map_ibfk_1` FOREIGN KEY (`USER_ID`) REFERENCES `user` (`USER_ID`) ON DELETE CASCADE;

--
-- Constraints for table `poi`
--
ALTER TABLE `poi`
  ADD CONSTRAINT `poi_ibfk_1` FOREIGN KEY (`MAP_ID`) REFERENCES `map` (`MAP_ID`) ON DELETE CASCADE;

--
-- Constraints for table `poi_connection`
--
ALTER TABLE `poi_connection`
  ADD CONSTRAINT `poi_connection_ibfk_1` FOREIGN KEY (`POI_CONN_TO`) REFERENCES `poi` (`POI_ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `poi_connection_ibfk_2` FOREIGN KEY (`POI_CONN_FROM`) REFERENCES `poi` (`POI_ID`) ON DELETE CASCADE;

--
-- Constraints for table `poi_connection_video`
--
ALTER TABLE `poi_connection_video`
  ADD CONSTRAINT `poi_connection_video_ibfk_1` FOREIGN KEY (`POI_CONN_ID`) REFERENCES `poi_connection` (`POI_CONN_ID`) ON DELETE CASCADE;

--
-- Constraints for table `poi_image`
--
ALTER TABLE `poi_image`
  ADD CONSTRAINT `poi_image_ibfk_1` FOREIGN KEY (`POI_ID`) REFERENCES `poi` (`POI_ID`) ON DELETE CASCADE;

--
-- Constraints for table `poi_video`
--
ALTER TABLE `poi_video`
  ADD CONSTRAINT `poi_video_ibfk_1` FOREIGN KEY (`POI_ID`) REFERENCES `poi` (`POI_ID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
