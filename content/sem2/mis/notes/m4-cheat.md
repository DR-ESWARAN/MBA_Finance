**MIS MODULE 4 — CHEAT SHEET**

**Databases and Data Warehouses — 1-Page Rapid Revision**

*Source: Module 4 Ebook + LMS Study Notes only*

**DATABASE —** Collection of data for **easy retrieval and
manipulation**. **DBMS = software**: definition · retrieval · access
control · sharing · integrity.

**FILE APPROACH FLAWS —** Duplication · inconsistency · **lack of
integration (independent files)** · data dependence · program
dependence. SN: manual retrieval.

**DB APPROACH —** **Centralised digital repository**; data and program
independent; tables of rows and columns.

| **Model**       | **Key fact**                                                      |
|-----------------|-------------------------------------------------------------------|
| Relational      | Codd 1970 · **collection of tables** · tuples, attributes, domain |
| Object-oriented | Objects = data + methods · inheritance · encapsulation            |
| Hierarchical    | IBM IMS 1966 · tree                                               |
| Network         | GE IDS 1967 · **set = 1:M** owner/member                          |

**SQL —** 4GL. SELECT = **rows** (horizontal) · PROJECT = columns · JOIN
= combine tables · UPDATE modifies · **GROUP BY** summarises · primary
key = unique ID.

**MODELLING —** Analysis of data objects + **relationships**. ERD:
rectangle entity, diamond relationship. 1:1 · 1:M · M:N.

**WEB / NoSQL —** Web DB → **PHP**; Daffodil DB. NoSQL = unstructured,
schema-less: **key-value** (Redis) · document (MongoDB) · column
(Cassandra).

**WAREHOUSE —** Inmon: subject-oriented · integrated · time-variant ·
non-volatile. **Analytical**. ETL → star/snowflake (fact + dimension) →
metadata → BI.

**OLTP/OLAP —** OLTP = daily, normalised · OLAP = analysis.
**Dimensional modelling** = OLTP → OLAP.

**MINING —** **Extracting patterns**; needs **appropriate** data.
Classification · clustering · regression · association · anomaly.

> **TRAPS:** *Relational = collection of rows → False · inappropriate
> data → False · Ebook calls warehouse "for TPS" but LMS = analytical ·
> fact table = detailed transaction data (LMS).*
