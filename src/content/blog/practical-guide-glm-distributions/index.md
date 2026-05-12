---
title: "A Practical Guide to GLM Distributions"
description: "How binomial, Poisson, negative binomial, gamma, inverse Gaussian, chi-square, and Tweedie distributions show up in modeling."
date: "2026-05-09"
category: "Data Science"
tags: ["GLM", "Distributions", "Statistics"]
---

When I first learned GLMs, I treated the distribution choice like a menu: binomial for classification, Poisson for counts, gamma for severity, and so on.

That is not wrong, but it is a little too shallow. The more useful way to think about it is this: the distribution describes what kind of response variable I believe I am modeling, and how the variance should behave as the expected value changes.

The model is still centered around the conditional mean:

```text
mu_i = E[Y_i | X_i]
g(mu_i) = X_i beta
```

The distribution tells the model what kind of randomness lives around that mean.

## Binomial

The binomial distribution is for successes out of a fixed number of trials.

```text
Y ~ Binomial(n, p)

E[Y] = np
Var(Y) = np(1 - p)
```

When `n = 1`, it becomes the Bernoulli distribution. That is the setup behind logistic regression: one observation, one event that either happens or does not happen.

```text
Y ~ Bernoulli(p)

E[Y] = p
Var(Y) = p(1 - p)
```

The reason we need a logit link is that the linear predictor can be any real number, but a probability has to stay between 0 and 1. The logit transforms probability into log-odds, so the model can work on an unbounded scale.

```text
logit(p) = log(p / (1 - p)) = X beta

p = exp(X beta) / (1 + exp(X beta))
```

That is the key mental shift for me: logistic regression is not directly modeling the probability on the raw scale. It is modeling log-odds, then mapping back to probability.

The assumptions I would keep in mind are: observations are independent, the outcome is conditionally binomial, and the relationship is linear on the log-odds scale.

## Poisson

Poisson is for counts: number of claims, number of calls, number of events in a fixed interval of time, space, or exposure.

```text
Y ~ Poisson(lambda)

E[Y] = lambda
Var(Y) = lambda
```

In a GLM, we usually write the conditional mean as `mu_i`:

```text
Y_i ~ Poisson(mu_i)
log(mu_i) = X_i beta
```

The strict Poisson assumption is that the mean and variance are equal. That is elegant, but real data often refuses to be that tidy.

In insurance frequency modeling, I would usually model claim count as the target and use exposure as an offset:

```text
log(E[claim_count_i]) = X_i beta + log(exposure_i)
```

This lets the model estimate count while still accounting for the amount of risk observed. The model may predict a continuous expected count, even though the observed target is discrete.

The issue I keep in mind is overdispersion.

```text
Overdispersion:
Var(Y) > E[Y]
```

If the variance is larger than the mean, the simple Poisson model is understating the amount of variability in the data. That can make standard errors and p-values look more confident than they should. I would check this with sample mean versus variance, Pearson residuals, deviance residuals, and residual patterns against fitted values.

## Negative binomial

Negative binomial is one way to handle overdispersed count data.

The intuition I like is that the Poisson rate itself varies across observations. Instead of assuming every policyholder has a fixed rate from one clean process, the negative binomial allows extra heterogeneity.

One common variance form is:

```text
E[Y] = mu
Var(Y) = mu + alpha * mu^2
```

When `alpha = 0`, this collapses toward the Poisson variance relationship. As `alpha` increases, the variance grows beyond the mean.

For insurance frequency, the important detail is that the target should still be a count, not a rate. Use claim count as the target and `log(exposure)` as the offset.

```text
log(E[claim_count_i]) = X_i beta + log(exposure_i)
```

That matters because the negative binomial variance is not a pure power variance in the same way as Poisson, gamma, or Tweedie GLMs. Dividing the count by exposure can break the distributional assumptions. The count-plus-offset setup respects the count process better.

## Gamma

Gamma is useful for positive continuous outcomes that are right-skewed.

That makes it a natural candidate for severity. Claim amounts are bounded below by zero, often concentrated at smaller values, and can have a long right tail.

```text
Y ~ Gamma(shape = alpha, scale = theta)

E[Y] = alpha * theta
Var(Y) = alpha * theta^2
```

In GLM form, I usually think about the mean-variance relationship:

```text
E[Y] = mu
Var(Y) = phi * mu^2
```

That quadratic variance relationship is useful because higher expected severity should usually come with higher variability too.

A log link also feels natural here:

```text
log(mu_i) = X_i beta
mu_i = exp(X_i beta)
```

It keeps predictions positive and makes coefficient effects multiplicative.

## Inverse Gaussian

Inverse Gaussian is also positive and right-skewed, but it has a sharper peak and a heavier tail than gamma.

I think of it as something to consider when severity is more extremely skewed and variance grows faster than the gamma relationship would suggest.

The GLM variance relationship is:

```text
E[Y] = mu
Var(Y) = phi * mu^3
```

That cubic relationship is the main practical clue. If I group the data, calculate empirical mean and variance within each group, and variance grows roughly quadratically with the mean, gamma may be reasonable. If variance grows more explosively, inverse Gaussian may be worth a look.

## Chi-square

Chi-square is different from the others in this list because I do not usually think of it as the response distribution I am choosing for a GLM.

I think of it as an inference distribution.

```text
If Z_1, Z_2, ..., Z_k are independent standard normal variables:

chi^2_k = Z_1^2 + Z_2^2 + ... + Z_k^2

E[chi^2_k] = k
Var(chi^2_k) = 2k
```

It is also a special case of the gamma distribution, which is a nice connection to remember.

In GLMs, chi-square logic shows up through likelihood theory. When comparing nested models, the deviance difference can be compared against a chi-square distribution under regularity conditions:

```text
Delta D = 2 * (log L_full - log L_reduced)

Delta D ~ chi^2_q
```

where `q` is the difference in the number of parameters.

So for me, chi-square sits more in the model comparison and inference toolbox than in the "what is my target variable?" toolbox.

## Tweedie

Tweedie is the distribution that made the most sense to me once I connected it to insurance.

It is useful when the response is nonnegative, has many zeros, and has positive continuous values when nonzero. That is exactly the shape of many pure premium or loss ratio targets.

Between power parameters 1 and 2, Tweedie can be understood as a compound Poisson-gamma process:

```text
N ~ Poisson(lambda)
X_i ~ Gamma(alpha, theta)

Y = X_1 + X_2 + ... + X_N
```

If `N = 0`, then `Y = 0`. If `N = 1`, total loss is one gamma severity. If `N = 5`, total loss is the sum of five gamma severities.

The GLM variance relationship is:

```text
E[Y] = mu
Var(Y) = phi * mu^p
```

The power parameter `p` controls the variance behavior:

```text
p = 0  -> Normal-like
p = 1  -> Poisson
1 < p < 2 -> Compound Poisson-gamma
p = 2  -> Gamma
p = 3  -> Inverse Gaussian
```

That is why Tweedie is so appealing for pure premium. It gives one distributional framework for both claim occurrence and claim amount.

The limitation is that it blends frequency and severity together. If a predictor affects frequency and severity in opposite directions, a pure premium model can hide that. In that case, separate frequency and severity models may be more informative.

## How I would choose

I would start with the shape of the target:

- Binary event: binomial.
- Count: Poisson or negative binomial.
- Positive skewed severity: gamma or inverse Gaussian.
- Nonnegative loss with many zeros: Tweedie.
- Model comparison or deviance testing: chi-square logic.

Then I would ask a second question: how should variance grow with the mean?

```text
Poisson:          Var(Y) = mu
Negative binomial: Var(Y) = mu + alpha * mu^2
Gamma:           Var(Y) = phi * mu^2
Inverse Gaussian: Var(Y) = phi * mu^3
Tweedie:         Var(Y) = phi * mu^p
```

That second question is where distribution choice becomes more than a label. It becomes an assumption about the data-generating process.
