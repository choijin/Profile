---
title: "How LLMs Work: Attention, Hallucination, Nondeterminism, and Agents"
description: "A compact note on token prediction, attention, hallucination, nondeterminism, and agent loops."
date: "2026-05-03"
category: "ML Systems"
tags: ["LLM", "AI Agents", "Machine Learning"]
---

A large language model predicts the next token.

That sounds simple, but the machinery behind it is powerful: tokenization, embeddings, positional information, attention, feed-forward layers, and repeated transformations across many layers.

## Training vs. inference

Training includes a forward pass and a backward pass. The model predicts tokens, calculates loss, and updates weights.

Inference is forward pass only. The model receives context, computes token probabilities, and chooses the next token according to the decoding strategy.

## Attention

Attention lets the model decide which tokens in the context matter for predicting the next token.

The query, key, and value mechanism gives each token a way to ask what information it needs, compare itself with other tokens, and retrieve useful information.

Multi-head attention repeats this process in parallel so different heads can focus on different relationships.

## Why hallucination happens

Hallucination is not just random error. It is connected to how models are trained and evaluated.

During pretraining, the model learns statistical patterns from text. During post-training, it can be rewarded for producing confident, helpful-looking answers. If evaluation rewards answers more than calibrated uncertainty, the model can learn to guess instead of admitting it does not know.

That is why hallucination is partly a training and incentive problem.

## Why outputs can be nondeterministic

Temperature is one reason outputs vary, but it is not the only one.

Even with low temperature, implementation details can matter. Floating-point arithmetic is not perfectly associative, and batching can change the order of operations. Small numerical differences can sometimes change token choices, especially when probabilities are close.

## Agents

An agent combines a model, tools, and an execution loop.

The model decides what to do next. Tools give it capabilities outside pure text generation. The loop lets it observe results and continue.

A simple agent cycle is:

1. Read the user request.
2. Decide whether a tool is needed.
3. Call the tool.
4. Observe the result.
5. Decide the next step.
6. Produce an answer or continue working.

The model is the reasoning engine, but the system design around it determines what it can actually do.
