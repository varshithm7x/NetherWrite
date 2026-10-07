# Filesystems and Storage

## Core idea
A filesystem organizes persistent data into files, directories, and metadata. It maps logical file offsets to underlying storage while managing naming, access control, and consistency.

## Essential concepts
A directory associates names with filesystem objects. Metadata includes size, ownership, permissions, and timestamps. In inode-based designs, an inode holds metadata and references to data blocks; directory entries provide names.

A hard link supplies another name for the same underlying object. A symbolic link contains a path to another object. Removing one hard link does not delete the file's contents while other links or relevant open references remain, according to filesystem semantics.

## Worked example: safe replacement pattern
A common update strategy writes a new file, flushes its contents as required, then renames it over the destination. On filesystems offering the relevant semantics, rename can make readers see the old complete file or the new complete file rather than a partially overwritten one.

```text
write temporary file in destination directory
flush and synchronize temporary file as needed
rename temporary file to destination
synchronize containing directory when durability requires it
```
Atomic visibility and crash durability are separate guarantees. Exact requirements depend on the filesystem and operating system.

## Journaling and recovery
A journal records intended changes so recovery can complete or undo interrupted metadata operations. Journaling does not automatically provide application-level [[09-Databases/44-transactions-and-isolation|transactions]] or protect against every hardware failure. Copy-on-write filesystems write new structures and update references rather than overwriting all data in place.

## Performance
Sequential access often benefits from readahead and fewer seeks. Random access can be expensive on rotating media. SSD behavior differs, but write amplification, controller caching, and flush costs still matter.

## Common mistakes
Closing a file or seeing a successful write does not always mean bytes are durable after power loss. Backups and snapshots have different retention and failure characteristics. File extensions do not determine actual content type.

## Revision check
**Question:** Does an atomic rename guarantee durable new data?
**Answer:** No. Durability may require additional synchronization of file data and directory metadata.

## Connected concepts

- [[06-Operating-Systems/34-input-output-and-interrupts|Input/Output, Interrupts, and DMA]] — Flushes, reads, and writes depend on I/O behavior.
- [[09-Databases/44-transactions-and-isolation|Transactions and Isolation]] — Crash-safe file updates and durable transactions share recovery concerns.

[Back to contents](../README.md)
