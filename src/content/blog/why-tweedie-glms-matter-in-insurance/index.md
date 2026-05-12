---
title: "Why Tweedie GLMs Matter in Insurance"
description: "Why Tweedie models are useful for pure premium, loss ratio, and nonnegative outcomes with many zeros."
date: "2026-05-08"
category: "Data Science"
tags: ["Tweedie", "GLM", "Insurance"]
---

In insurance, the target often has an awkward shape. Many policies have zero loss. The policies that do have loss are positive, skewed, and sometimes very large. That is not a clean normal target, and it is not just a simple count either.

Tweedie is useful because it is built for data that is nonnegative, right-skewed, and contains exact zeros.

## The insurance intuition

For power parameters between 1 and 2, the Tweedie distribution can be understood as a compound Poisson-gamma process.

That means two random things are happening:

- the number of claims follows a Poisson process
- the size of each claim follows a gamma distribution

Written as a formula:

```text
N ~ Poisson(lambda)
X_i ~ Gamma(alpha, theta)

Y = sum_{i=1}^{N} X_i
```

If there are no claims, total loss is zero:

```text
If N = 0, then Y = 0
```

If there is one claim, total loss is one gamma-like severity. If there are several claims, total loss is the sum of those severities.

That is why Tweedie fits pure premium thinking so naturally. Pure premium is already combining frequency and severity.

```text
Pure premium = frequency * severity
```

Tweedie gives one model for the total loss outcome directly.

## The mean-variance relationship

The important GLM assumption is that variance grows as a power of the mean:

```text
E[Y] = mu
Var(Y) = phi * mu^p
```

The power parameter `p` controls the shape:

```text
p = 0  -> Normal-like variance
p = 1  -> Poisson
1 < p < 2 -> Compound Poisson-gamma
p = 2  -> Gamma
p = 3  -> Inverse Gaussian
```

For pure premium, the useful range is usually between 1 and 2. That range is what gives Tweedie the mix of exact zeros and positive continuous values.

I also like the coefficient-of-variation intuition from my notes. When the gamma severity part has a very small coefficient of variation, the Tweedie behavior moves closer to Poisson-like. When severity is much more variable, the behavior moves closer to gamma-like.

## Why the log link feels natural

Tweedie GLMs often use a log link:

```text
log(mu_i) = X_i beta
mu_i = exp(X_i beta)
```

I like the log link in this context because it keeps predictions positive and makes effects multiplicative.

For a coefficient `beta_j`, a one-unit increase in `X_j` changes expected loss by a multiplicative factor:

```text
mu_new / mu_old = exp(beta_j)
```

In pricing work, multiplicative effects are easier to think about than additive effects. A coefficient behaves more like a discount, surcharge, or rating factor adjustment.

## Why the density is awkward

One technical detail I found interesting: for Tweedie with `1 < p < 2`, the density does not have a simple closed form. It is usually expressed as an infinite series.

That matters because it affects how software fits the model.

In many implementations, the main coefficient estimation does not require directly optimizing a neat closed-form Tweedie likelihood. Instead, the GLM can be fit using quasi-likelihood ideas that rely on the mean-variance relationship:

```text
Var(Y_i) = phi * mu_i^p
```

The fitting algorithm can use IRLS, or iteratively reweighted least squares. At each step, the model solves a weighted least squares problem:

```text
beta_new = (X' W X)^(-1) X' W z
```

For Tweedie with a log link, the working weights depend on the mean and the variance power. A simplified way to remember the variance part is:

```text
W_i is related to 1 / mu_i^p
```

After convergence, dispersion can be estimated from deviance or Pearson residuals. The exact density or series approximation may matter for likelihood-based inference, but the coefficient fitting can lean heavily on the GLM mean-variance structure.

That is why tools like Statsmodels can fit Tweedie GLMs through the GLM framework, and tools like H2O can fit regularized Tweedie models efficiently with IRLS-style outer loops and optimized inner solvers.

## Severity vs. frequency

Tweedie models pure premium directly. That is convenient, but it also means frequency and severity are blended.

The hidden assumption is that predictors tend to move frequency and severity in a compatible direction. Sometimes that is reasonable. Sometimes it is not.

A variable might increase claim frequency but decrease severity. Or it might barely affect frequency but strongly affect severity. If I only model pure premium, those stories can get blurred.

Separate frequency and severity models often give more diagnostic insight:

```text
Frequency model:
E[claim_count] or E[claim_count / exposure]

Severity model:
E[claim_amount | claim occurred]

Pure premium:
frequency * severity
```

The tradeoff is that separate models require more moving parts. Tweedie gives a strong one-model baseline when the target shape is the main issue.

## Choosing the power parameter

The power parameter `p` is important, but I do not think of it as something that always needs obsessive tuning.

In practice, people often start with values like `1.5`, `1.6`, `1.67`, or `1.7` depending on the target and domain. Some software can estimate or search over `p`, but small changes in `p` may not materially change the business conclusion.

What matters more is whether the model structure matches the target:

- exact zeros are meaningful
- positive outcomes are continuous and skewed
- variance increases with the mean
- pure premium is a reasonable target to model directly

## Why I care

Tweedie GLMs are not a perfect answer to insurance modeling. But they are a very useful baseline because they match a common insurance target shape: many zeros, positive losses, skewness, and variance that grows with expected loss.

The main caution is interpretability. Tweedie can be practical and elegant, but it can also hide whether a variable is acting through frequency, severity, or both. That is the part I would always check before treating the model as the final story.
