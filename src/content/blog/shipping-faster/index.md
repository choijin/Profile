---
title: "Shipping Faster With Smaller PRs"
description: "How breaking work into tiny pull requests changed how my team ships."
date: "2026-04-18"
---

The biggest change I have made to my engineering workflow is reducing the size of each pull request. Smaller PRs make review faster, lower the emotional cost of changing direction, and create a cleaner history of why decisions happened.

A small PR is not just fewer lines of code. It is a complete, understandable unit of progress. Sometimes that means a refactor with no behavior change. Sometimes it means a tiny visible feature. The point is that the reviewer can hold the entire change in their head.

When I am planning a larger feature, I try to split it into setup, data model, interface, behavior, and polish. Each step should be safe to merge on its own.
