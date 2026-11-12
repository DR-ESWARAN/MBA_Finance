**MANAGEMENT INFORMATION SYSTEMS**

**Module 4 — Databases and Data Warehouses**

*Notes · Source: Module 4 Ebook (primary) + LMS Study Notes,
Misconceptions, Objective QB only*

> **Read this first:** *The **Ebook** covers the DBMS and its functions,
> the **traditional file approach vs the database approach**, database
> models (**relational, object-oriented, hierarchical, network**, flat
> file), SQL operators (**SELECT, PROJECT, JOIN**), data modelling and
> the **E-R model**, web databases (PHP, Daffodil DB), data warehousing
> (Inmon's four features), data mining and **OLTP vs OLAP**. The **Study
> Notes** (LMS follows these) add SQL commands (INSERT, UPDATE, DELETE,
> **GROUP BY**, ORDER BY), keys, **NoSQL** (key-value, document,
> column-family), **ETL**, star/snowflake schemas and data mining
> techniques.*
>
> **Source conflict (flagged):** *The Ebook says a data warehouse is "an
> RDBMS designed specifically to meet the needs of **transaction
> processing systems**". The Study Notes and the LMS say the opposite:
> data warehouses support **analytical processing**, not transactional.
> The Ebook's own OLTP vs OLAP section agrees with the SN. **For the
> LMS, pick "analytical".***

**1. Database and DBMS**

- **Database** = a collection of data organised for **easy retrieval and
  manipulation** (QB). Keyword list: a collection of logically related
  records or files serving many applications.

- **DBMS** = a **software** tool (QB) that stores data in a specified
  form and gives access to a user or application.

  **Data definition** — structure for stored data

  **Data retrieval** — query tools

  **Access control** — DBA defines access by person or group

  **Data sharing** — many users at once without overwriting

  **Data integrity** — survives failures and incomplete updates

- Introducing a DBMS needs organisational change and often meets
  **political resistance** because it shifts power over data.

**2. Traditional file approach vs database approach**

- **Traditional (file processing):** each function (marketing, finance,
  production) kept its own programs and files, a **piecemeal** approach.
  SN adds the paper version: ledgers, registers, **manual retrieval**,
  error-prone, space problems.

| **Drawback**             | **Meaning (Ebook)**                                                              |
|--------------------------|----------------------------------------------------------------------------------|
| Data duplication         | Same data in many files (payroll and personnel both hold name, designation)      |
| Data inconsistency       | Copies not updated together (designation changed in payroll, not in PF)          |
| Lack of data integration | Because of **independent** data files, ad hoc queries across files are hard (QB) |
| Data dependence          | File organisation fixed by one application (customer file only by last name)     |
| Program dependence       | Any format change or new report needs new programs                               |

- **Database approach:** a common pool of related data shared by many
  applications; **data and program independent**; redundancy and
  inconsistency minimised. SN: a **centralised, structured digital
  repository** (LMS answer) built on tables.

- Advantages: controlled redundancy, consistency, sharing, integrity,
  security, standards, economy of scale, accessibility, productivity,
  concurrency, backup and recovery.

> **Misconception:** *Traditional methods are **not** as effective as
> database-driven approaches, which are dynamic and scalable.*

**3. Database models**

- **Database model (schema)** = structure or format of a database in a
  formal language supported by the DBMS. Types: **relational,
  object-oriented, hierarchical, network, flat file**.

| **Model**       | **Key facts**                                                                                                                                                                                      |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Relational      | **E.F. Codd, 1970**; predicate logic and set theory; data in **tables** (relations) of rows (**tuples**) and columns (**attributes**); domain = allowed values; seen as a **collection of tables** |
| Object-oriented | Stores **objects** (data + methods); encapsulation, inheritance, polymorphism; avoids "impedance mismatch"; ODMG standards poorly implemented; used in engineering and molecular biology           |
| Hierarchical    | **IBM IMS, 1966**; upside-down tree, parent-child; simple and secure but lacks structural independence                                                                                             |
| Network         | **GE IDS, 1967**; a relationship is a **set** of owner and member records; a set = **1:M** relationship (QB True)                                                                                  |
| Flat file       | Single table; relational DB = many such tables                                                                                                                                                     |

> **QB trap:** *"The relational database is perceived as a collection of
> **rows**" = **False**. The Ebook says a **collection of tables**.*

- Relational rules: column order does not matter, no identical rows, one
  value per attribute. Advantages: structural independence, simplicity,
  **ad hoc queries through SQL**. Disadvantages: hardware overhead, poor
  design risk, "islands of information".

- **Keys:** **primary key** uniquely identifies a row (LMS); **foreign
  key** links tables (SN); natural key (ISBN) vs surrogate key (employee
  ID); compound key = several columns; keys drive **indexes**.

**4. SQL and relational operations**

- **SQL** = Structured Query Language, a **4GL** (vs 3GL COBOL, C). Two
  basic single-table operators:

| **Operator**         | **What it does**                                          |
|----------------------|-----------------------------------------------------------|
| SELECT (selection)   | Picks **rows** that meet a condition = **horizontal cut** |
| PROJECT (projection) | Picks **columns** = **vertical cut**                      |
| JOIN                 | Combines **two or more tables** over a common field       |

- Generic syntax: **SELECT** field list **FROM** tables **WHERE**
  condition.

| **SN command** | **Use**                                                             |
|----------------|---------------------------------------------------------------------|
| INSERT         | Add new records                                                     |
| UPDATE         | **Modify existing records**                                         |
| DELETE         | Remove records                                                      |
| JOIN           | Combine related rows from tables                                    |
| GROUP BY       | **Group rows with same values into summary rows** (COUNT, SUM, AVG) |
| ORDER BY       | Sort ascending/descending                                           |
| WHERE          | Filter records                                                      |

**5. Data modelling and ERD**

- **Data modelling** = analysis of data objects used in a business and
  the **identification of relationships** among them (QB). Conceptual
  models (what: **E-R model**) vs implementation models (how:
  hierarchical, network, relational, object-oriented, semi-structured).

- Relationships: **1:1** (store-manager), **1:M** (painter-paintings),
  **M:N** (employees-skills).

- **E-R model**: entities (rectangles), relationships (**diamonds**),
  attributes. Pros: conceptual simplicity, visual, communication tool.
  Cons: limited constraints, **no data manipulation language**.

- SN: ERDs **represent relationships visually**; tools MySQL Workbench,
  Visio, ERWin; ERD → schema: entity → table, attribute → column,
  relationship → foreign key. Misconception: modelling tools do more
  than draw ERDs.

**6. Databases on the web and NoSQL**

- **Web database** stores large amounts of information in an organised
  format easily accessible from **scripting languages like PHP** (QB).
  **PHP** = open-source server-side scripting. **Daffodil DB** = Java
  RDBMS, under 3 MB, first Java DB compatible with PHP.

- SN: web databases drive **dynamic content**, user-generated content,
  personalisation and caching. Misconception: they are not just passive
  repositories.

| **NoSQL type** | **Storage · examples · use**                              |
|----------------|-----------------------------------------------------------|
| Key-value      | **Key-value pairs** · Redis, DynamoDB · caching, sessions |
| Document       | JSON-like documents · MongoDB, CouchDB · CMS, e-commerce  |
| Column-family  | Columns not rows · Cassandra, HBase · time series, logs   |

- NoSQL suits **large unstructured or semi-structured data**, scales
  horizontally, **schema-less**. Challenge: possible inconsistency.

**7. Data warehouse**

- **Inmon's definition:** a **subject-oriented, integrated,
  time-variant, non-volatile** collection of data in support of
  management decisions.

| **Feature**      | **Meaning**                                                         |
|------------------|---------------------------------------------------------------------|
| Subject-oriented | Organised by subject (customer, premium, claim), not by application |
| Integrated       | Consistent coding across sources (gender m/f vs 0/1 standardised)   |
| Time-variant     | Historical data, **5 to 10 years**, for trends and forecasting      |
| Non-volatile     | Not updated once loaded; only **loading and access**                |

- Kept **separately** from operational databases; "the logical link
  between what managers see in DSS/EIS and operations" (John McIntyre,
  SAS). Uses: customer focus, product repositioning, profit analysis,
  CRM, heterogeneous DB integration.

- **Update-driven** (warehouse: integrate in advance) beats
  **query-driven** (traditional: filter on each query) for frequent
  aggregate queries.

- **SN components:** source systems → **ETL (Extract, Transform, Load)**
  → warehouse database (**star/snowflake schemas** with **fact** and
  **dimension** tables) → **metadata repository** → **BI tools**.
  Transform = clean and standardise.

> **Gap flagged:** *The Study Notes name fact tables but do not define
> them. The LMS key says a fact table holds **detailed transaction
> data**; use that on the LMS.*

**8. OLTP vs OLAP**

|          | **OLTP**                           | **OLAP**                       |
|----------|------------------------------------|--------------------------------|
| Purpose  | Day-to-day operations              | Analysis, reports, data mining |
| Records  | Single or small sets               | Very large sets                |
| Design   | **Normalised** (no duplicate data) | Dimensional                    |
| Examples | Airline bookings, banking          | Data warehouse                 |

- **Dimensional modelling** = holding OLTP data in an **OLAP** format;
  the primary building block of data warehousing (QB).

**9. Data mining**

- **Data mining** = the process of **extracting patterns from data**
  (QB). Data roughly doubles every three years. Uses: marketing,
  surveillance, **fraud detection**, science.

- Mining potential improves when **appropriate** data is stored in a
  warehouse. Non-representative samples mislead; it is not a "crystal
  ball".

> **QB trap:** *"Data mining potential can be enhanced if the
> **inappropriate** data has been collected" = **False**. The Ebook says
> **appropriate**.*

- SN techniques: **classification, clustering, regression, association
  rules** (items bought together), **anomaly detection**. Process:
  objectives → preparation → algorithm → model → insights → BI →
  continuous improvement.

**10. Knowledge Check answers (SN)**

| **\#** | **Question**                                               | **Answer**        |
|--------|------------------------------------------------------------|-------------------|
| 1      | Discovering patterns in large datasets                     | **Data Mining**   |
| 2      | Key NoSQL advantage                                        | **Schema-less**   |
| 3      | T in ETL                                                   | **Transform**     |
| 4      | Warehouses differ from DBs optimised for \_\_\_ processing | **Transactional** |
| 5      | ERDs represent relationships in relational DBs             | **True**          |
| 6      | NoSQL strictly follows a predefined schema                 | **False**         |
| 7      | Warehousing focuses on analytical processing               | **True**          |
| 8      | BI tools only do extraction and loading                    | **False**         |

> **Exam traps:** *database = easy retrieval and manipulation · DBMS =
> software · independent files → poor integration · relational =
> collection of **tables** · network set = 1:M · data modelling =
> relationships among data objects · web DB → PHP · selection = rows,
> projection = columns · UPDATE modifies · GROUP BY summarises · primary
> key = unique ID · key-value DB · warehouse = analytical · ETL ·
> dimensional modelling = OLTP → OLAP.*
>
> **Clinical analogy:** *Separate cath-lab, ward and pharmacy registers
> are the traditional file approach: your patient's allergy is updated
> in one and not the other. A hospital EMR is the database approach. A
> registry like the national PCI registry is the data warehouse:
> historical, integrated, not edited after entry, built for analysis.*
