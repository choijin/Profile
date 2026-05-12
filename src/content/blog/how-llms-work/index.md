---
title: "How LLMs Work"
description: "A narrative note on next-token prediction, attention, training, inference, hallucination, nondeterminism, and agents."
date: "2026-05-03"
category: "Data Science"
tags: ["LLM", "Attention", "AI Agents"]
---

The simplest description of an LLM is also the one I find easiest to underestimate:

An LLM predicts the next token.

Given a sequence of tokens, it produces a probability distribution over the vocabulary. Training pushes the model to assign higher probability to the actual next token.

The loss is usually cross-entropy, or negative log-likelihood:

```text
L = - sum_t log P(x_t | x_<t)
```

That formula is small, but a lot is hiding inside it. The model has to turn tokens into vectors, let those vectors exchange information, transform them through many layers, and finally map the last hidden state back into probabilities over possible next tokens.

## Tokens become vectors

Text first gets broken into tokens. A word like "unbelievable" might become pieces such as `un`, `believe`, and `able`.

Each token is mapped to a learned vector through an embedding matrix. During training, these vectors move around so they capture patterns of usage. The vector for a token is not a dictionary definition. It is a learned location in a high-dimensional space.

The high dimensionality matters. In a large embedding space, the model can represent many subtle relationships because meanings do not have to be perfectly orthogonal to be distinguishable.

## Position has to be added

Token embeddings alone do not know order.

The model needs to distinguish "dog bites man" from "man bites dog." So positional information is added to the token embeddings. That gives the model a way to know where each token sits in the sequence while still allowing the computation to happen efficiently in parallel.

## Attention is where context moves

Attention is the mechanism that lets each token look at other tokens and decide what is relevant.

The query, key, and value setup helped me understand this:

- Query: what this token is looking for.
- Key: what another token can offer.
- Value: the information that gets passed along if attention decides it is relevant.

For every query-key pair, the model computes an alignment score. The usual scaled dot-product attention formula is:

```text
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
```

The `QK^T` part decides where to look. The softmax turns scores into weights. The multiplication by `V` carries the actual content forward.

Without values, attention would know which tokens relate to each other, but it would not know what information to transfer.

## A small example

Take the phrase "the red car."

The token for "car" might ask, "Do I have an adjective describing me?" That is the query. The token "red" might offer, "I am an adjective that can describe a noun." That is the key.

If the query and key align, the attention score is high. Then the value vector from "red" contributes to the updated representation of "car."

After attention, the vector for "car" is no longer just car. It is closer to "car, specifically red car."

That is the part I find elegant. Attention does not just identify relationships. It updates representations using those relationships.

## Multi-head attention

One attention head can learn one kind of relationship. Multiple heads let the model track many relationships in parallel.

One head might focus on adjective-noun relationships. Another might track subject-verb agreement. Another might carry longer-range topic information.

The heads are concatenated and mixed back together with an output projection. The model learns how to combine the different kinds of context each head found.

## The MLP is not just filler

After attention, each token vector passes through an MLP.

The rough division of labor I keep in mind is:

- attention decides where information should move
- the MLP transforms what was gathered

The MLP layers are also where a lot of broad world-pattern capacity lives. Attention lets the token representation absorb context; MLPs give the model more capacity to transform and store useful patterns.

A transformer repeats this sequence many times:

```text
attention -> MLP -> attention -> MLP -> ...
```

By the final layers, the last token vector has absorbed context from earlier tokens and transformations from the model's learned parameters.

## Final prediction

To predict the next token, the model usually uses the hidden state of the last token.

That vector is projected back into vocabulary space:

```text
logits = W_out h_last
P(next token) = softmax(logits)
```

The result is a probability distribution over the vocabulary. A decoding strategy then chooses the next token: greedy decoding, top-k sampling, nucleus sampling, or something else.

Then the chosen token is appended to the context, and the process repeats.

## Training vs. inference

Training includes a forward pass and a backward pass.

During the forward pass, the model produces probabilities and calculates loss. During the backward pass, gradients are computed and weights are updated with an optimizer such as Adam.

Inference is forward pass only. The model produces probabilities, selects a token, appends it, and continues. No weights are updated.

That difference matters. During inference, the model is not learning from the conversation in the training sense. It is only conditioning on the context it has been given.

## Why hallucination happens

Hallucination makes more sense when I remember that the training objective rewards predicting plausible next tokens.

The model is not born with a truth database. It learns statistical patterns. During post-training, if evaluation rewards confident answers more than calibrated uncertainty, models can become overconfident test-takers. They may guess because guessing often looks more helpful than saying "I do not know."

So hallucination is not just a random defect. It is tied to pretraining, post-training, and evaluation incentives.

## Why outputs can differ

Temperature and sampling explain some nondeterminism, but not all of it.

Even when temperature is zero, real inference systems use dynamic batching. Your prompt might be processed alone in one run and with many other prompts in another run. That can change tensor shapes, memory layouts, kernel choices, and reduction orders.

Floating-point arithmetic is not perfectly associative:

```text
(0.1 + 1e20) - 1e20  -> 0
0.1 + (1e20 - 1e20)  -> 0.1
```

Transformers involve enormous parallel sums. Small numerical differences can shift logits. If the top tokens are close, a tiny logit shift can change the chosen token, and once one token changes, the rest of the sequence can diverge.

The chain is:

```text
batch changes -> execution order changes -> floating-point differences -> logit shifts -> token changes -> sequence changes
```

## Agents

An agent is not a fundamentally different brain. It is a model connected to tools and placed inside a loop.

The simple version is:

```text
state = initial_context

while not done:
    prompt = build_prompt(state)
    output = model(prompt)

    if output is a tool call:
        result = execute_tool(output.tool, output.args)
        state = update_state(state, result)
    else:
        return final_answer
```

The model decides what to do. The tools let it act. The loop lets it observe results and continue.

Fine-tuning can help agents choose tools correctly, produce structured outputs, and make fewer tool-use mistakes. But the core mechanism is still model plus tools plus loop.

That is the way I currently understand LLMs: next-token prediction at the center, attention and MLPs doing the representation work, and systems built around the model to make it useful.
