# schema_dump.R - dump the MidwestDDi schema (structure only, no row data) to files.
#
#   Rscript tools/schema_dump.R            # writes schema/ next to this script's repo root
#
# Everything here is a SELECT against catalog views; it never reads table contents. Row counts come
# from sys.partitions (metadata), not from scanning tables. Output files contain no borrower data.

suppressPackageStartupMessages({ library(DBI); library(odbc) })

dsn <- Sys.getenv("BR_DSN", "sqlDueDiligence"); db <- Sys.getenv("BR_DB", "MidwestDDi")
con <- dbConnect(odbc::odbc(), dsn = dsn, database = db, ApplicationIntent = "ReadOnly")
cleanup <- function() try(dbDisconnect(con), silent = TRUE)
f <- grep("^--file=", commandArgs(FALSE), value = TRUE)
out <- if (length(f)) file.path(dirname(sub("^--file=", "", f[1])), "..", "schema") else "schema"   # repo_root/schema when run via Rscript, else ./schema
dir.create(out, showWarnings = FALSE, recursive = TRUE)

q <- function(sql) dbGetQuery(con, sql)

columns <- q("
  SELECT c.TABLE_SCHEMA AS [schema], c.TABLE_NAME AS [table], t.TABLE_TYPE AS [type], c.ORDINAL_POSITION AS pos, c.COLUMN_NAME AS [column],
         c.DATA_TYPE AS data_type, c.CHARACTER_MAXIMUM_LENGTH AS max_len, c.NUMERIC_PRECISION AS prec, c.NUMERIC_SCALE AS scale,
         c.IS_NULLABLE AS nullable, c.COLUMN_DEFAULT AS [default],
         COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS is_identity
  FROM INFORMATION_SCHEMA.COLUMNS c
  JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
  ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION")

keys <- q("
  SELECT tc.TABLE_SCHEMA AS [schema], tc.TABLE_NAME AS [table], tc.CONSTRAINT_TYPE AS key_type, tc.CONSTRAINT_NAME AS constraint_name,
         kcu.COLUMN_NAME AS [column], kcu.ORDINAL_POSITION AS pos,
         rc.UNIQUE_CONSTRAINT_NAME AS references_constraint
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
  JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
  LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
  WHERE tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
  ORDER BY tc.TABLE_SCHEMA, tc.TABLE_NAME, tc.CONSTRAINT_TYPE, kcu.ORDINAL_POSITION")

indexes <- q("
  SELECT SCHEMA_NAME(t.schema_id) AS [schema], t.name AS [table], i.name AS index_name, i.type_desc AS index_type, i.is_unique,
         STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
  FROM sys.indexes i JOIN sys.tables t ON t.object_id = i.object_id
  JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
  JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.name IS NOT NULL
  GROUP BY t.schema_id, t.name, i.name, i.type_desc, i.is_unique ORDER BY 1, 2, 3")

rowcounts <- q("
  SELECT SCHEMA_NAME(t.schema_id) AS [schema], t.name AS [table], SUM(p.rows) AS approx_rows
  FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
  GROUP BY t.schema_id, t.name ORDER BY 1, 2")

views <- q("SELECT TABLE_SCHEMA AS [schema], TABLE_NAME AS [view], VIEW_DEFINITION AS definition FROM INFORMATION_SCHEMA.VIEWS ORDER BY 1, 2")

routines <- q("
  SELECT ROUTINE_SCHEMA AS [schema], ROUTINE_NAME AS name, ROUTINE_TYPE AS type, ROUTINE_DEFINITION AS definition
  FROM INFORMATION_SCHEMA.ROUTINES ORDER BY 1, 3, 2")

write.csv(columns, file.path(out, "columns.csv"), row.names = FALSE, na = "")
write.csv(keys, file.path(out, "keys.csv"), row.names = FALSE, na = "")
write.csv(indexes, file.path(out, "indexes.csv"), row.names = FALSE, na = "")
write.csv(rowcounts, file.path(out, "rowcounts.csv"), row.names = FALSE, na = "")
writeLines(unlist(lapply(seq_len(nrow(views)), function(i) c(sprintf("-- %s.%s", views$schema[i], views$view[i]), views$definition[i], ""))), file.path(out, "views.sql"))
writeLines(unlist(lapply(seq_len(nrow(routines)), function(i) c(sprintf("-- %s %s.%s", routines$type[i], routines$schema[i], routines$name[i]), routines$definition[i], ""))), file.path(out, "routines.sql"))

# one readable Markdown summary
md <- c(sprintf("# %s schema (dumped %s)", db, format(Sys.time(), "%Y-%m-%d %H:%M")), "")
for (tb in unique(paste(columns$schema, columns$table, sep = "."))) {
  cc <- columns[paste(columns$schema, columns$table, sep = ".") == tb, ]
  rc <- rowcounts$approx_rows[paste(rowcounts$schema, rowcounts$table, sep = ".") == tb]
  pk <- keys$column[keys$key_type == "PRIMARY KEY" & paste(keys$schema, keys$table, sep = ".") == tb]
  md <- c(md, sprintf("## %s  (%s%s rows)%s", tb, cc$type[1], if (length(rc)) paste0(", ~", format(rc, big.mark = ",")) else "",
                      if (length(pk)) paste0("  PK: ", paste(pk, collapse = ", ")) else ""), "",
          "| # | column | type | null | default |", "|--:|---|---|---|---|",
          sprintf("| %d | %s | %s%s | %s | %s |", cc$pos, cc$column, cc$data_type,
                  ifelse(!is.na(cc$max_len), paste0("(", ifelse(cc$max_len == -1, "max", cc$max_len), ")"),
                         ifelse(!is.na(cc$prec) & cc$data_type %in% c("decimal", "numeric"), paste0("(", cc$prec, ",", cc$scale, ")"), "")),
                  cc$nullable, ifelse(is.na(cc$default), "", cc$default)), "")
}
writeLines(md, file.path(out, "SCHEMA.md"))
cat(sprintf("%d tables/views, %d columns, %d keys, %d views, %d routines -> %s\n", length(unique(paste(columns$schema, columns$table))), nrow(columns), nrow(keys), nrow(views), nrow(routines), normalizePath(out)))

cleanup()
