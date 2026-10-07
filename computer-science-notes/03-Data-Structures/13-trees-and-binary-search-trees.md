# Trees and Binary Search Trees

## Core idea
A tree is a connected acyclic graph. A rooted tree adds parent–child relationships. A binary tree has at most two children per node; a binary search tree (BST) additionally orders keys.

## Essential concepts
For a BST with distinct keys, every left-subtree key is smaller than the node's key, and every right-subtree key is larger. Duplicate-key policies must be defined separately. Height measures the longest downward path; whether counted in edges or nodes should be stated.

Search, insertion, and deletion take `O(h)` for height `h`. A balanced tree has logarithmic height; an unbalanced BST can become a chain with linear height.

## Traversals
- **Preorder:** node, left subtree, right subtree; useful for some serialization tasks.
- **Inorder:** left subtree, node, right subtree; yields sorted keys in a BST.
- **Postorder:** left subtree, right subtree, node; useful for bottom-up computation.
- **Level order:** visit by depth using a queue.

## Worked example
Insert `8, 3, 10, 1, 6` into an empty BST. The root is `8`; `3` and `10` become its children; `1` and `6` become children of `3`. Inorder traversal returns `1, 3, 6, 8, 10`.

To delete a node with two children, one common method replaces its key with the inorder successor, then removes that successor from the right subtree. Maintain associated values and metadata consistently.

## Balanced variants
AVL trees maintain a strict height-balance condition. Red-black trees maintain coloring invariants that bound height. Rotations change local structure while preserving inorder key order.

## Common mistakes
A binary tree is not automatically a BST. Checking only direct children does not validate the full BST ordering invariant; descendant keys must obey ancestor bounds.

## Revision check
**Question:** What happens when sorted values enter an ordinary unbalanced BST?
**Answer:** They can create a chain and degrade operations to `O(n)`.

## Connected concepts

- [[02-Algorithms/17-searching-and-binary-search|Searching and Binary Search]] — BST lookup follows ordered branches instead of halving an indexed array.
- [[09-Databases/45-database-indexes-and-query-plans|Database Indexes and Query Plans]] — B-tree-family indexes adapt ordered trees for storage access.

[Back to contents](../README.md)
