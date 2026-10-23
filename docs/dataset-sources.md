# Indian Public Datasets - Comprehensive Source Catalog

This document details the provenance, methodology, access conditions, and field definitions of the Indian public datasets integrated into the Autonomous SQL Database Analyst.

## 1. Compliance and Licensing
- **License:** Open Government Data License - India (OGDL-India)
- **Official Terms:** Permission is granted to copy, publish, distribute, adapt, and use the data for commercial and non-commercial purposes, provided attribution to the source is maintained.
- **Access Model:** Local verified seed files with automated pipeline ingestion into relational PostgreSQL and schema registration in MongoDB.

## 2. Source Catalogs

### A. District Labour Force & Unemployment (PLFS)
- **Source:** https://www.mospi.gov.in and https://data.gov.in
- **Agency:** National Statistical Office (NSO), Ministry of Statistics and Programme Implementation (MoSPI).
- **Survey Design:** Rotational panel sampling of rural and urban households using Current Weekly Status (CWS) and Usual Principal and Subsidiary Status (UPSS).
- **Time Periods Included:** 2021-22 and 2022-23.
- **Key Formulas:**
  - `Unemployment Rate (UR)` = $(Unemployed \div Labour\ Force) \times 100$
  - `Labour Force Participation Rate (LFPR)` = $(Labour\ Force \div Total\ Population) \times 100$
  - `Worker Population Ratio (WPR)` = $(Employed \div Total\ Population) \times 100$

### B. District Census Statistics (Census of India)
- **Source:** https://censusindia.gov.in
- **Agency:** Office of the Registrar General & Census Commissioner, India (ORGI), Ministry of Home Affairs.
- **Collection Method:** Decennial nationwide census enumeration.
- **Time Periods Included:** Census 2001 & Census 2011.
- **Key Indicators:** Total Population, Gender Breakdown, Sex Ratio (Females per 1,000 Males), Literacy Rate (%).

### C. National Family Health Survey (NFHS-5)
- **Source:** http://rchiips.org/nfhs/factsheet_NFHS-5.shtml
- **Agency:** Ministry of Health and Family Welfare (MoHFW) / International Institute for Population Sciences (IIPS).
- **Survey Cycle:** Phase 1 (2019-20) & Phase 2 (2020-21).
- **Indicators:** Maternal health, institutional deliveries, sanitation access, child immunization rates.
