---
title: "How LLMs Work"
description: "Notes on next-token prediction, tokenization, embeddings, attention, MLPs, training, inference, hallucination, and nondeterminism."
date: "2025-01-18"
order: 8
category: "Data Science"
tags: ["LLM", "Attention", "Transformers"]
---

At the highest level, an LLM is a **next-token predictor**.

Given a sequence of tokens, it produces a probability distribution over what token should come next. Training is basically making the model assign high probability to the correct next token.

```text
Loss = - sum_t log P(x_t | x_<t)
```

This is cross-entropy loss, or negative log-likelihood. If the model puts high probability on the true next token, the loss is small. If it puts low probability on the true next token, it gets a big penalty.

Text has to become tokens. Tokens become vectors. Those vectors pass through attention and MLP layers again and again. At the end, the model looks at the last hidden vector and turns it into probabilities over the vocabulary.

## Training vs. inference

**Training** is forward pass plus backward pass.

```text
tokens -> embeddings -> attention -> MLP -> ... -> softmax -> loss
loss -> gradients -> parameter updates
```

During training, the model computes the loss, calculates gradients with *backpropagation*, and updates parameters with an optimizer like Adam.

**Inference** is forward pass only.

```text
tokens -> embeddings -> attention -> MLP -> ... -> softmax -> next-token probabilities
```

No gradients are calculated, and no parameters are updated. The model just produces a **probability distribution** for the next token, samples or chooses a token, appends it to the context, and repeats.

So when we chat with an LLM, it is not learning from the conversation in the training sense. It is inferencing on the context we give it.

## What gets learned

The model learns a lot of matrices.

- The embedding matrix maps token IDs into vectors. This is learned during training.
- Attention matrices learn `W_q`, `W_k`, `W_v`, and `W_o`.
- Multilayer Perceptron (MLP) weights transform each token representation.
- The final projection matrix maps the last hidden vector back to vocabulary logits. This is sometimes tied/shared with the embedding matrix.

## Tokenization and embeddings

Text is first broken into tokens. A word can be split into subword pieces.

```text
"unbelievable" -> ["un", "believe", "able"]
```

Each token becomes a vector through a learned lookup table, the embedding matrix.

```text
token_id -> embedding vector
```

The geometric part is interesting. In an `N`-dimensional space, we can fit `N` perfectly orthogonal vectors. But if we relax perfect orthogonality (vectors ~88–92° apart), we can pack vectors exponetially more (more meaning). That is why high-dimensional embedding spaces have so much expressive capacity.

The embedding is not enough by itself, though. The model also needs word order.

## Positional information

Embeddings alone do not know position.

The model needs to distinguish:

```text
dog bites man
man bites dog
```

So positional information is added to the token embeddings. This lets the model know where each token sits in the sequence while still allowing the computation to run in parallel on GPUs.

## Attention: Q, K, and V

Attention is the mechanism that lets each token "look at" other tokens and decide what is relevant. The Q (Query) vector represents what a token is “asking about,” such as “Do I have an adjective describing me?”. The K (Key) vector represents what a token can “offer,” such as “I am an adjective that could describe something”. To check whether a Key answers a Query, we take the dot product of their vectors. 

We compute these dot products for every Query–Key pair, producing a score matrix. Then we apply a softmax to each row so the scores become normalized attention weights — essentially a probability distribution over which tokens are most relevant to the current one.

We introduce Q, K, V matrices so that the model learns what to ask (Q), what to offer (K), and what to pass (V). Learned projections give the model the freedom to figure this out from data.

- **Q, Query:** what this token is looking for. Example: “sat” → “Which noun is my subject?”
- **K, Key:** what information another token can offer. Example: “cat” → “I am a possible subject.”
- **V, Value:** the actual content or message that gets passed.

To check whether a key answers a query, the model takes a dot product:

```text
score_ij = Q_i dot K_j
```

High positive score means strong relevance. Near zero means not much relevance. Negative means opposing signal.

Then softmax turns the scores into attention weights:

```text
attention_weights = softmax(QK^T / sqrt(d_k))
```

Then the values carry the payload:

```text
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V
```

Q and K decide **who looks at whom**. V carries **what gets transferred**.

Without V, attention would know relationships, but it would not enrich token meanings. The model needs `W_v` so it can learn what information each token should contribute to others. The model learns how to filter, compress, transform its embedding into the right information to pass along

## A small attention example

Take the phrase:

```text
The red car
```

The token `"car"` may have a query like: "Do I have an adjective describing me?"

The token `"red"` may have a key like: "Yes, I am an adjective that describes nouns."

If `Q_car dot K_red` is high, the attention weight from `"car"` to `"red"` becomes high. Then the value vector from `"red"` gets added into the updated representation of `"car"`. Now, the Value vector of “red” encodes the specific modification: redness.

The weighted sum adds that Value to “car’s” representation. Result: The new embedding of “car” now carries the meaning “car, but specifically red.”

The Value is the payload of information that actually flows once attention establishes the connection.


## Why not just use embedding similarity?

A naive version without QKV matrices could be:

```text
attention_weights = softmax(embeddings @ embeddings.T)
context = attention_weights @ embeddings
```

But this has problems:

- no parameterization
- same similarity function across all layers and heads
- cannot learn different relationships like syntax, semantics, position, or agreement
- same embedding is used every time, regardless of context

By introducing Q, K, and V, the model learns:

- what should be considered similar
- what should be paid attention to
- what information should be passed along

That is why learned projections matter.

## Multi-head attention

Instead of one attention map, the model uses multiple heads in parallel.

Each head can specialize. One head might track adjective-noun relationships. Another might track subject-verb agreement. Another might track long-range topic consistency.

The heads produce separate proposed updates to the token representations. Then the model concatenates those outputs and uses an output matrix `W_o` which learns how to mix and reweight contributions from different heads.

```text
multiple heads -> concatenate -> W_o -> updated token vectors
```

This keeps the heads from being siloed. `W_o` learns how to reweight and combine their contributions.

## MLP layers

After attention, each token vector goes through an MLP.

Attention mixes information across tokens. MLPs process and enrich that information per token. A lot of the model's stored knowledge and broad patterns live in these dense layers.

The model repeats this many times:

```text
Attention -> MLP -> Attention -> MLP -> ...
```

Each layer refines the representation. By the final layers, the last token vector has absorbed contextual meaning from attention and general knowledge from the model parameters.

## Final prediction

When predicting the next token, the model usually uses the hidden state of the last token.

That last vector has absorbed so much information from context and learned transformations that it can be used to predict what comes next.

```text
h_last -> W_out -> logits -> softmax -> probability distribution
```

The output matrix has shape roughly:

```text
W_out: vocabulary_size x hidden_dimension
```

After softmax, we get probabilities over the vocabulary.

```text
"The cat sat on the" -> {"mat": 0.72, "floor": 0.15, "roof": 0.01, ...}
```

A sampling strategy chooses the next token. Greedy decoding picks the highest-probability token. Other strategies, like top-k or nucleus sampling, sample from a restricted set of likely tokens.

Then the selected token is appended, and the process repeats.

## Why hallucinations happen

Hallucinations persist because of how models are trained and evaluated, which rewards guessing over honesty. Specifically, the authors trace hallucinations to statistical learning factors in pretraining and to misaligned incentives in post-training (fine-tuning and evaluation).

During post-training, the field has (unintentionally) reinforced hallucinations by grading models with a strict accuracy paradigm, turning our LLMs into overconfident test-takers.

## Why LLMs can be nondeterministic

source
Temperature and sampling explain some randomness, but not all of it.

Even at `temperature = 0`, outputs can differ in real inference systems because the computation path can differ.

At inference, providers use dynamic batching. One run might process my prompt alone. Another run might process it with many other prompts.

```text
Run 1: prompt processed with 7 others
Run 2: prompt processed alone
Run 3: prompt processed with 31 others
```

Different batches can lead to different tensor shapes, memory layouts, kernel choices, and reduction orders.

Floating-point arithmetic is not associative:

```text
(0.1 + 1e20) - 1e20 = 0
0.1 + (1e20 - 1e20) = 0.1
```

Transformer operations involve massive parallel sums on GPUs. Slight numerical differences can shift logits. If the top two tokens are close, a small logit shift can change the selected token. Once one token changes, the rest of the sequence can diverge.

The chain is:

```text
batch change
-> execution order change
-> floating-point difference
-> logit shift
-> different token
-> different sequence
```

Temperature affects sampling randomness, but if the logits themselves differ slightly, even deterministic argmax can produce different outputs.

## My takeaway

LLM is very difficult to understand, and even as I took notes to try to understand, I don't think I fully have it in my head. But the simplest description would be that an LLM predicts the next token.

But the interesting part is how much is packed into that prediction. Tokenization creates pieces. Embeddings create vectors. Positional information adds order. Attention decides where information should move. Values carry the payload. MLPs transform and store patterns. The final hidden state becomes a probability distribution over the vocabulary.

That is also why LLM behavior can feel both impressive and strange. I think by understanding what is under the hood, I can discern what is hype and what is not.
