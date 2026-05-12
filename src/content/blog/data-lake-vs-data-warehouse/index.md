---
title: "Data Lake vs. Data Warehouse"
description: "Why cheap storage is not the whole story when designing analytical data platforms."
date: "2026-05-04"
category: "ML Systems"
tags: ["Data Engineering", "Data Lake", "Warehouse"]
---

The tempting question is: if a data lake is cheaper, why not put everything there?

That question sounds clever for about two seconds. Then real usage starts.

A data lake and a data warehouse solve different problems. The lake is good at storing large amounts of raw or semi-structured data. The warehouse is good at giving people clean, governed, repeatable answers.

## Storage is not the only cost

A data lake is useful because it is flexible and cheap. It can hold raw files, logs, semi-structured data, historical snapshots, and data that may not have a clear use yet.

That is valuable for machine learning, replay, exploration, and long-term storage.

But cheap storage does not automatically mean cheap analytics.

If every analyst has to query raw files and rebuild the same cleaning logic, the cost just moves somewhere else. It shows up as duplicated work, inconsistent definitions, slow queries, and low trust.

## The warehouse role

A warehouse is where data becomes usable for repeated consumption.

It provides structure, modeled tables, access control, performance, and consistent definitions. That matters when finance, product, leadership, or operations need the same answer to mean the same thing every time.

Raw data is not trusted data. It may be valuable, but it is not automatically ready for dashboards, reporting, or business decisions.

## ETL and ELT

The lake-versus-warehouse discussion also connects to ETL and ELT.

ETL transforms data before loading it into the serving layer. ELT loads data first, then transforms it where it lives.

In larger systems, ELT often fits better because raw data can land quickly in a lake, then be transformed into curated tables for analytics.

The important thing is not the acronym. It is keeping the ingestion layer, transformation logic, and consumption layer clear.

## Where lakehouse fits

A lakehouse tries to bring warehouse-like table management to files in a lake.

The mental model I like is:

```text
S3 stores the actual data files.
Iceberg defines how files form a table.
Glue Catalog stores metadata about where the table is.
Athena or Spark queries the table.
```

That adds structure, snapshots, and metadata to lake storage. It does not erase the warehouse/lake distinction completely, but it does make the lake more usable for analytical workloads.

## The practical split

The lake is where data lands.

The warehouse is where data becomes usable.

The lakehouse tries to reduce the gap between the two.

Good data engineering is not just optimizing for the cheapest storage layer. It is designing the system so data can be stored, transformed, trusted, queried, and reused without everyone rebuilding the same logic from scratch.
